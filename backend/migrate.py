from sqlalchemy import create_engine, text
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tucusa.db")
engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})

with engine.connect() as conn:
    result = conn.execute(text("PRAGMA table_info(users)"))
    columns = {row[1] for row in result.fetchall()}

    # 1. Constituency (if not already added)
    if 'constituency' not in columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN constituency VARCHAR DEFAULT 'Turkana Central'"))
        print("✅ Added 'constituency' column (default: 'Turkana Central' for existing users)")
    else:
        print("ℹ️ 'constituency' already exists")

    # 2. National ID photo
    if 'national_id_photo' not in columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN national_id_photo VARCHAR"))
        print("✅ Added 'national_id_photo' column")
    else:
        print("ℹ️ 'national_id_photo' already exists")

    # 3. Student ID photo
    if 'student_id_photo' not in columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN student_id_photo VARCHAR"))
        print("✅ Added 'student_id_photo' column")
    else:
        print("ℹ️ 'student_id_photo' already exists")

    conn.commit()
    print("\n🎉 Migration complete! Your existing data is safe.")