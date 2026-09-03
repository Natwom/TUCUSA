from app.database import SessionLocal
from app import models
from app.core.security import hash_password

def create_admin():
    db = SessionLocal()
    try:
        # Check if any admin exists
        existing = db.query(models.User).filter(models.User.role == "admin").first()
        if existing:
            print(f"Admin already exists: {existing.email}")
            return

        admin = models.User(
            email="admin@tucusa.ac.ke",
            password_hash=hash_password("TucusaAdmin2024!"),  # CHANGE THIS AFTER LOGIN
            full_name="System Administrator",
            admission_number="ADMIN-001",
            course="Administration",
            year_of_study=4,
            phone="+254700000000",
            constituency="Central",
            profile_picture=None,
            national_id_photo=None,
            student_id_photo=None,
            role="admin",
            is_active=True,
            is_approved=True,
        )
        db.add(admin)
        db.commit()
        print("✅ Admin created successfully!")
        print("   Email: admin@tucusa.ac.ke")
        print("   Password: TucusaAdmin2024!")
        print("   ⚠️  Change this password immediately after first login.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()