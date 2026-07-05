"""
Email service using Resend for transactional emails (verification, password reset).
"""
import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY


async def send_verification_email(to_email: str, company_name: str, token: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    resend.Emails.send({
        # "from": settings.EMAIL_FROM,
        "from": "onboarding@resend.dev",
        "to": to_email,
        "subject": "Verify your Avenue account",
        "html": f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Welcome to Avenue, {company_name}!</h2>
          <p>Please verify your email address to get started.</p>
          <a href="{verify_url}" style="background:#4F46E5;color:white;padding:12px 24px;
             border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
            Verify Email
          </a>
          <p style="margin-top:24px;color:#6B7280;font-size:14px;">
            Link expires in 24 hours. If you didn't sign up for Avenue, ignore this email.
          </p>
        </div>
        """,
    })


async def send_password_reset_email(to_email: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    resend.Emails.send({
        # "from": settings.EMAIL_FROM,
        "from": "onboarding@resend.dev",
        "to": to_email,
        "subject": "Reset your Avenue password",
        "html": f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Password Reset Request</h2>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="{reset_url}" style="background:#4F46E5;color:white;padding:12px 24px;
             border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#6B7280;font-size:14px;">
            If you didn't request a password reset, ignore this email.
          </p>
        </div>
        """,
    })
