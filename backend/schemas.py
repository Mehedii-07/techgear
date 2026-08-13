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

    class Config:
        from_attributes = True

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
    created_at: datetime
    items: List[OrderItemResponse]
    address: Optional[AddressResponse] = None

    class Config:
        from_attributes = True