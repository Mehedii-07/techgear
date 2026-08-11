import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()

# Get the database URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a session maker (this is how we query the DB later)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the base class for our future tables
Base = declarative_base()