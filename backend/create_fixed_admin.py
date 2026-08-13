from database import SessionLocal
import models
import auth
import sys

def create_or_update_admin(email, password):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        hashed_password = auth.get_password_hash(password)
        
        if user:
            user.hashed_password = hashed_password
            user.role = "admin"
            print(f"Updated existing user {email} to admin.")
        else:
            new_user = models.User(email=email, hashed_password=hashed_password, role="admin")
            db.add(new_user)
            print(f"Created new admin user {email}.")
            
        db.commit()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_or_update_admin("mehedi@gmail.com", "1234")
