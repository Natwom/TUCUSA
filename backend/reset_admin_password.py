from app.database import SessionLocal
from app import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_admin_password():
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.role == "admin").first()
        if not admin:
            print("No admin found.")
            return

        new_password = "AdminPass123!"  # Change to whatever you want
        admin.password_hash = pwd_context.hash(new_password)
        db.commit()

        print(f"✅ Password reset for: {admin.email}")
        print(f"   New password: {new_password}")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password()