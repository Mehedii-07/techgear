# Use the official lightweight Python image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the entire backend directory into the container
COPY . /app

# Install uv for fast dependency management
RUN pip install uv

# Sync and install the dependencies defined in your pyproject.toml
RUN uv sync

# Expose the port that FastAPI runs on
EXPOSE 8000

# Start the FastAPI application using uvicorn
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]