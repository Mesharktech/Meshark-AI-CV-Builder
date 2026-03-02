import smtplib
import email.mime.multipart
import email.mime.base
import email.mime.text
from email import encoders
from core.config import settings

def send_cv_email_sync(recipient_email: str, first_name: str, pdf_bytes: bytes):
    if not settings.SMTP_EMAIL or not settings.SMTP_PASS:
        raise Exception("Email not configured on the server.")

    msg = email.mime.multipart.MIMEMultipart()
    msg["From"]    = f"Meshark AI <{settings.SMTP_EMAIL}>"
    msg["To"]      = recipient_email
    msg["Subject"] = "Your Meshark AI CV is Ready 🎉"

    body = email.mime.text.MIMEText(
        f"Hi {first_name},\n\n"
        "Your professional CV has been generated and is attached to this email.\n\n"
        "Best of luck with your applications!\n\n— The Meshark AI Team",
        "plain"
    )
    msg.attach(body)

    attachment = email.mime.base.MIMEBase("application", "octet-stream")
    attachment.set_payload(pdf_bytes)
    encoders.encode_base64(attachment)
    attachment.add_header("Content-Disposition", "attachment", filename="Meshark_AI_CV.pdf")
    msg.attach(attachment)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASS)
        server.send_message(msg)
