from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: int

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class CategoryBase(BaseModel):
    name: str
    slug: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    price: float
    stock: int = 0
    description: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    product_id: int
    rating: int
    text: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    text: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AddressBase(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    city: str
    postal_code: str

class AddressCreate(AddressBase):
    pass

class AddressResponse(AddressBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    address_id: Optional[int] = None
    transaction_id: str

class OrderResponse(BaseModel):
    id: int
    user_id: int
    address_id: Optional[int] = None
    status: str
    transaction_id: Optional[str] = None
    tracking_number: Optional[str] = None
    courier_name: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    created_at: datetime
    refund_status: Optional[str] = None
    items: List[OrderItemResponse]
    address: Optional[AddressResponse] = None

    class Config:
        from_attributes = True

class OrderTrackingUpdate(BaseModel):
    tracking_number: str
    courier_name: str
    estimated_delivery: datetime

class AnalyticsResponse(BaseModel):
    total_sales: float
    total_orders: int
    total_customers: int
    total_products: int
    today_sales: float
    monthly_sales: float
    low_stock_products: int
    pending_orders: int
    best_selling_products: List[dict]
    revenue_graph: List[dict]
    customer_growth: List[dict]