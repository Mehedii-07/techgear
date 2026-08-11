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