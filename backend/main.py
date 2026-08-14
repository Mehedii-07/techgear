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
    allow_origins=["*"], # Allows all frontend domains (Vercel, Netlify, etc.)
    allow_credentials=False,
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

@app.put("/users/me", response_model=schemas.UserResponse)
def update_current_user(
    user_update: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number
        
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/auth/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    import secrets
    from datetime import datetime, timedelta
    
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # Return same response to prevent email enumeration
        return {"message": "If that email is in our system, we have sent a password reset link."}
        
    reset_token = secrets.token_hex(32)
    user.reset_token = reset_token
    user.token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    # Simulate sending email
    print(f"\n[MOCK EMAIL] Password Reset requested for {user.email}")
    print(f"[MOCK EMAIL] Reset Token: {reset_token}\n")
    
    return {"message": "If that email is in our system, we have sent a password reset link."}

@app.post("/auth/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    
    user = db.query(models.User).filter(models.User.reset_token == request.token).first()
    if not user or not user.token_expiry or user.token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.token_expiry = None
    db.commit()
    
    return {"message": "Password successfully reset."}

# --- ADMIN USER MANAGEMENT ---
@app.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_admin_user)):
    return db.query(models.User).all()

@app.put("/admin/users/{user_id}/ban", response_model=schemas.UserResponse)
def toggle_user_ban(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot ban yourself.")
        
    user.is_active = 0 if user.is_active == 1 else 1
    db.commit()
    db.refresh(user)
    return user

@app.put("/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def toggle_user_role(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")
        
    user.role = "admin" if user.role == "customer" else "customer"
    db.commit()
    db.refresh(user)
    return user

# --- ADMIN DASHBOARD ---
@app.get("/admin/analytics", response_model=schemas.AnalyticsResponse)
def get_admin_analytics(current_user: models.User = Depends(auth.get_admin_user), db: Session = Depends(get_db)):
    from sqlalchemy import extract
    import datetime
    from datetime import timedelta
    
    # Basic Metrics
    total_sales = db.query(func.sum(models.Product.price * models.OrderItem.quantity)).join(models.OrderItem, models.OrderItem.product_id == models.Product.id).scalar() or 0
    total_orders = db.query(models.Order).count()
    total_customers = db.query(models.User).filter(models.User.role == "customer").count()
    total_products = db.query(models.Product).count()
    
    today_sales_query = db.query(func.sum(models.Product.price * models.OrderItem.quantity))\
        .join(models.OrderItem, models.OrderItem.product_id == models.Product.id)\
        .join(models.Order, models.Order.id == models.OrderItem.order_id)\
        .filter(func.date(models.Order.created_at) == func.current_date()).scalar() or 0
        
    monthly_sales_query = db.query(func.sum(models.Product.price * models.OrderItem.quantity))\
        .join(models.OrderItem, models.OrderItem.product_id == models.Product.id)\
        .join(models.Order, models.Order.id == models.OrderItem.order_id)\
        .filter(extract('month', models.Order.created_at) == extract('month', func.current_date()))\
        .filter(extract('year', models.Order.created_at) == extract('year', func.current_date())).scalar() or 0
        
    low_stock = db.query(models.Product).filter(models.Product.stock < 5).count()
    pending_orders = db.query(models.Order).filter(models.Order.status == "pending").count()
    
    # Best Selling Products
    best_selling = db.query(
        models.Product.name,
        func.sum(models.OrderItem.quantity).label("total_sold")
    ).join(models.OrderItem, models.OrderItem.product_id == models.Product.id)\
    .group_by(models.Product.id)\
    .order_by(func.sum(models.OrderItem.quantity).desc())\
    .limit(5).all()
    best_selling_list = [{"name": b.name, "total_sold": int(b.total_sold)} for b in best_selling]
    
    # Revenue Graph (last 30 days)
    thirty_days_ago = datetime.datetime.utcnow() - timedelta(days=30)
    revenue_data = db.query(
        func.date(models.Order.created_at).label("date"),
        func.sum(models.Product.price * models.OrderItem.quantity).label("total")
    ).join(models.OrderItem, models.OrderItem.order_id == models.Order.id)\
    .join(models.Product, models.Product.id == models.OrderItem.product_id)\
    .filter(models.Order.created_at >= thirty_days_ago)\
    .group_by(func.date(models.Order.created_at))\
    .order_by(func.date(models.Order.created_at)).all()
    revenue_graph = [{"date": str(r.date), "total": float(r.total)} for r in revenue_data]
    
    # Customer Growth (mocked for now)
    customer_growth = [
        {"month": "Jan", "new_users": 10},
        {"month": "Feb", "new_users": 25},
        {"month": "Mar", "new_users": 40},
        {"month": "Apr", "new_users": 65},
        {"month": "May", "new_users": 80},
        {"month": "Jun", "new_users": 120}
    ]
    
    return schemas.AnalyticsResponse(
        total_sales=total_sales,
        total_orders=total_orders,
        total_customers=total_customers,
        total_products=total_products,
        today_sales=today_sales_query,
        monthly_sales=monthly_sales_query,
        low_stock_products=low_stock,
        pending_orders=pending_orders,
        best_selling_products=best_selling_list,
        revenue_graph=revenue_graph,
        customer_growth=customer_growth
    )

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
    status: str = Query(..., pattern="^(pending|processing|shipped|delivered|cancelled)$"),
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

@app.put("/orders/{order_id}/cancel", response_model=schemas.OrderResponse)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if db_order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
        
    if db_order.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")
        
    db_order.status = "cancelled"
    db_order.refund_status = "requested"
    
    # Restore stock
    for item in db_order.items:
        db_product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if db_product:
            db_product.stock += item.quantity
            
    db.commit()
    db.refresh(db_order)
    return db_order

@app.post("/orders/{order_id}/refund-request", response_model=schemas.OrderResponse)
def request_refund(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if db_order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to request refund for this order")
        
    if db_order.status not in ["shipped", "delivered"]:
        raise HTTPException(status_code=400, detail="Only shipped or delivered orders can have a return/refund requested")
        
    db_order.refund_status = "requested"
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/admin/orders/{order_id}/refund", response_model=schemas.OrderResponse)
def process_refund(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_admin_user)
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db_order.refund_status = "refunded"
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/admin/orders/{order_id}/tracking", response_model=schemas.OrderResponse)
def update_order_tracking(
    order_id: int,
    tracking_data: schemas.OrderTrackingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_admin_user)
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db_order.tracking_number = tracking_data.tracking_number
    db_order.courier_name = tracking_data.courier_name
    db_order.estimated_delivery = tracking_data.estimated_delivery
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