# Avenue Backend — TODO

## Bugs & Issues

- [ ] **Wallet creation missing fields** — `create_wallet` in [`wallets.py`](app/api/v1/wallets.py) doesn't pass `first_name`, `last_name`, or `email` from the request body to the `Wallet` model (lines 58–68), even though the model requires them as `NOT NULL`.
- [ ] **`create_error_response` parameter mismatch** — In [`errors.py`](app/core/errors.py) line 19, `validation_exception_handler` passes `"Validation error"` (a string) as the `status_code` parameter instead of the `message` parameter.
- [ ] **Alembic not configured** — No `alembic.ini` or `env.py` exists. `alembic/versions/` only has `.gitkeep`. Migrations infrastructure needs to be set up and initial migration generated.
- [ ] **No tests** — `tests/` only has an empty `__init__.py`. Need tests for critical paths (auth, inbound webhooks, ledger, wallet creation).

## Improvements

- [ ] Deployment / CI/CD pipeline setup
