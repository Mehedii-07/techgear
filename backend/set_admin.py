import sys
from database import SessionLocal
import models

def make_admin(email: str):
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"User with email {email} not found!")
        return
    
    user.role = "admin"
    db.commit()
    print(f"Successfully promoted {email} to admin!")
    db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python set_admin.py <email>")
        sys.exit(1)
    make_admin(sys.argv[1])
