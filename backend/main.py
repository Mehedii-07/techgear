from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
import bcrypt
import models
import schemas
import auth
from database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TechGear API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- ADMIN DASHBOARD ---
@app.get("/admin/dashboard")
def admin_only_route(current_user: models.User = Depends(auth.get_admin_user), db: Session = Depends(get_db)):
    total_sales = db.query(func.sum(models.Product.price * models.OrderItem.quantity)).join(models.OrderItem, models.OrderItem.product_id == models.Product.id).scalar() or 0
    total_orders = db.query(models.Order).count()
    return {
        "message": f"Welcome to the admin dashboard, {current_user.email}!",
        "metrics": {
            "total_sales": total_sales,
            "total_orders": total_orders
        }
    }

# --- CATEGORIES ---
@app.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.post("/categories", response_model=schemas.CategoryResponse)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_admin_user)):
    new_category = models.Category(**category.model_dump())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

# --- PRODUCTS ---
@app.get("/products", response_model=List[schemas.ProductResponse])
def get_products(
    skip: int = 0, limit: int = 100, 
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    products = query.offset(skip).limit(limit).all()
    return products

@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/products", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_admin_user)
):
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_admin_user)
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product.model_dump().items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_admin_user)
):
    from sqlalchemy.exc import IntegrityError
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        db.delete(db_product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete product because it has been ordered by customers. Please set the stock to 0 instead."
        )

# --- ORDERS & CHECKOUT ---
@app.post("/checkout", response_model=schemas.OrderResponse)
def checkout(
    order: schemas.OrderCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify stock first
    for item in order.items:
        db_product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        if db_product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product '{db_product.name}'. Remaining: {db_product.stock}")
            
    new_order = models.Order(
        user_id=current_user.id, 
        address_id=order.address_id, 
        status="pending",
        transaction_id=order.transaction_id
    )
    db.add(new_order)
    db.flush() # Flush to get new_order.id without committing yet
    
    for item in order.items:
        # Deduct stock
        db_product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        db_product.stock -= item.quantity
        
        db_item = models.OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/orders/my-orders", response_model=List[schemas.OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).all()
    return orders

@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_admin_user)
):
    return db.query(models.Order).all()

@app.put("/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    status: str = Query(..., pattern="^(pending|processing|shipped|delivered)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_admin_user)
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_order.status = status
    db.commit()
    db.refresh(db_order)
    return db_order

# --- ADDRESSES ---
@app.post("/addresses", response_model=schemas.AddressResponse)
def create_address(
    address: schemas.AddressCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_address = models.Address(**address.model_dump(), user_id=current_user.id)
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address

@app.get("/addresses", response_model=List[schemas.AddressResponse])
def get_addresses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Address).filter(models.Address.user_id == current_user.id).all()

# --- REVIEWS ---
@app.post("/reviews", response_model=schemas.ReviewResponse)
def create_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_review = models.Review(**review.model_dump(), user_id=current_user.id)
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@app.get("/reviews/{product_id}", response_model=List[schemas.ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.product_id == product_id).all()