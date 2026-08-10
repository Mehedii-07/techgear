from fastapi import FastAPI

app = FastAPI(title="TechGear API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the TechGear Backend!"}
