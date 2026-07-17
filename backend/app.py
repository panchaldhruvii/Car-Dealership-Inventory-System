from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth, vehicles

# Create Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Car Dealership Inventory System",
    description="FastAPI Backend for Car Dealership Inventory",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Home Route
@app.get("/")
def home():
    return {
        "message": "Car Dealership Inventory API is Running"
    }

# Routers
app.include_router(auth.router)
app.include_router(vehicles.router)