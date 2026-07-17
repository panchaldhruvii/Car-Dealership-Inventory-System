from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

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

# Routers
app.include_router(auth.router)
app.include_router(vehicles.router)

# Serve Frontend Static Files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")