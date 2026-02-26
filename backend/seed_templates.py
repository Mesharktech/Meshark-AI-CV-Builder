import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Template

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_templates():
    db = SessionLocal()
    try:
        # Check if templates already exist
        existing = db.query(Template).first()
        if existing:
            print("Templates already seeded.")
            return

        templates_to_add = [
            Template(
                id="moderncv",
                name="Modern (Free)",
                description="A clean, professional two-column layout perfect for traditional roles.",
                thumbnail_url="https://makefreecv.com/assets/images/templates/professional.jpg", # Placeholder image for now
                is_premium=False,
                price=0,
                storage_path="templates/template_moderncv.tex",
                is_active=True
            ),
            Template(
                id="colorful",
                name="Creative Colors (Premium)",
                description="Stand out from the crowd with vibrant header sections. Ideal for modern digital roles.",
                thumbnail_url="https://makefreecv.com/assets/images/templates/creative.jpg", # Placeholder image for now
                is_premium=True,
                price=500,
                storage_path="templates/template_colorful.tex",
                is_active=True
            )
        ]

        db.add_all(templates_to_add)
        db.commit()
        print("Successfully seeded templates table!")
        
    except Exception as e:
        print(f"Error seeding templates: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_templates()
