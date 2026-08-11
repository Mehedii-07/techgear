from typing import List

from pydantic import BaseModel

# Data we expect the user to send us when registering
class UserCreate(BaseModel):
    email: str
    password: str

# Data we safely return back to the user (notice there is NO password here!)
class UserResponse(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True
class Token(BaseModel):
    access_token: str
    token_type: str
class ProductBase(BaseModel):
    name: str
    price: float
    stock: int = 0

# Used when an admin creates a product
class ProductCreate(ProductBase):
    pass

# Used when sending product data back to the client
class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
# Represents a single item in the shopping cart
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

# Represents the data sent back for a single item
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int

    class Config:
        from_attributes = True

# What the user sends to the server to check out
class OrderCreate(BaseModel):
    items: List[OrderItemCreate]

# The final receipt sent back to the user
class OrderResponse(BaseModel):
    id: int
    user_id: int
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True