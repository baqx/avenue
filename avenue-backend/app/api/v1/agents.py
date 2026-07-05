"""Agent routes — CRUD, toggle, global list, execution logs."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentDeveloper
from app.core.errors import ForbiddenError, NotFoundError
from app.db.models.agent import Agent, AgentLog
from app.db.models.developer import Developer
from app.db.models.wallet import Wallet
from app.db.session import get_db
from app.schemas.agent import (
    AgentListResponse, AgentLogResponse, AgentResponse,
    CreateAgentRequest, ToggleAgentRequest, UpdateAgentRequest,
)
from app.schemas.base import StandardResponse

router = APIRouter()


@router.post("/wallets/{wallet_id}/agents", response_model=StandardResponse[AgentResponse], status_code=status.HTTP_201_CREATED)
async def create_agent(
    wallet_id: uuid.UUID, body: CreateAgentRequest,
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    wallet = await _get_wallet_or_404(wallet_id, developer, db)
    agent = Agent(
        wallet_id=wallet.id, developer_id=developer.id, name=body.name,
        trigger=body.trigger, threshold=body.threshold, action=body.action,
        destination_wallet_id=body.destination_wallet_id, sweep_amount=body.sweep_amount,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return StandardResponse(data=AgentResponse.model_validate(agent))


@router.get("/wallets/{wallet_id}/agents", response_model=StandardResponse[AgentListResponse])
async def list_wallet_agents(
    wallet_id: uuid.UUID, page: int = Query(1, ge=1), limit: int = Query(20),
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    await _get_wallet_or_404(wallet_id, developer, db)
    query = select(Agent).where(Agent.wallet_id == wallet_id)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    agents = result.scalars().all()
    return StandardResponse(data=AgentListResponse(items=[AgentResponse.model_validate(a) for a in agents], total=total, page=page, limit=limit))


@router.get("/wallets/{wallet_id}/agents/{agent_id}", response_model=StandardResponse[AgentResponse])
async def get_agent(
    wallet_id: uuid.UUID, agent_id: uuid.UUID,
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    agent = await _get_agent_or_404(agent_id, wallet_id, developer, db)
    return StandardResponse(data=AgentResponse.model_validate(agent))


@router.patch("/wallets/{wallet_id}/agents/{agent_id}", response_model=StandardResponse[AgentResponse])
async def update_agent(
    wallet_id: uuid.UUID, agent_id: uuid.UUID, body: UpdateAgentRequest,
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    agent = await _get_agent_or_404(agent_id, wallet_id, developer, db)
    if body.name is not None:
        agent.name = body.name
    if body.threshold is not None:
        agent.threshold = body.threshold
    if body.destination_wallet_id is not None:
        agent.destination_wallet_id = body.destination_wallet_id
    if body.sweep_amount is not None:
        agent.sweep_amount = body.sweep_amount
    await db.commit()
    await db.refresh(agent)
    return StandardResponse(data=AgentResponse.model_validate(agent))


@router.patch("/wallets/{wallet_id}/agents/{agent_id}/toggle", response_model=StandardResponse[AgentResponse])
async def toggle_agent(
    wallet_id: uuid.UUID, agent_id: uuid.UUID, body: ToggleAgentRequest,
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    agent = await _get_agent_or_404(agent_id, wallet_id, developer, db)
    agent.is_active = body.is_active
    await db.commit()
    await db.refresh(agent)
    return StandardResponse(data=AgentResponse.model_validate(agent))


@router.delete("/wallets/{wallet_id}/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    wallet_id: uuid.UUID, agent_id: uuid.UUID,
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    agent = await _get_agent_or_404(agent_id, wallet_id, developer, db)
    await db.delete(agent)
    await db.commit()


@router.get("/agents", response_model=StandardResponse[AgentListResponse])
async def list_all_agents(
    page: int = Query(1, ge=1), limit: int = Query(20),
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    query = select(Agent).where(Agent.developer_id == developer.id)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    agents = result.scalars().all()
    return StandardResponse(data=AgentListResponse(items=[AgentResponse.model_validate(a) for a in agents], total=total, page=page, limit=limit))


@router.get("/agents/{agent_id}/logs")
async def get_agent_logs(
    agent_id: uuid.UUID, page: int = Query(1, ge=1), limit: int = Query(20),
    developer: Developer = CurrentDeveloper, db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.developer_id == developer.id))
    if not result.scalar_one_or_none():
        raise NotFoundError("Agent")
    query = select(AgentLog).where(AgentLog.agent_id == agent_id)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.order_by(AgentLog.created_at.desc()).offset((page - 1) * limit).limit(limit))
    logs = result.scalars().all()
    return StandardResponse(data={"items": [AgentLogResponse.model_validate(l) for l in logs], "total": total, "page": page, "limit": limit})


async def _get_wallet_or_404(wallet_id: uuid.UUID, developer: Developer, db: AsyncSession) -> Wallet:
    result = await db.execute(select(Wallet).where(Wallet.id == wallet_id, Wallet.developer_id == developer.id))
    w = result.scalar_one_or_none()
    if not w:
        raise NotFoundError("Wallet")
    return w


async def _get_agent_or_404(agent_id: uuid.UUID, wallet_id: uuid.UUID, developer: Developer, db: AsyncSession) -> Agent:
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.wallet_id == wallet_id, Agent.developer_id == developer.id))
    a = result.scalar_one_or_none()
    if not a:
        raise NotFoundError("Agent")
    return a
