from sqlalchemy.orm import Session
from sqlalchemy import or_

from models import User, Vehicle
from schemas import UserRegister, VehicleCreate, VehicleUpdate
from auth import hash_password, verify_password


# ==========================================
# USER CRUD
# ==========================================

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserRegister):
    hashed_pwd = hash_password(user.password)

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


# ==========================================
# VEHICLE CRUD
# ==========================================

def create_vehicle(db: Session, vehicle: VehicleCreate):
    new_vehicle = Vehicle(**vehicle.model_dump())

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return new_vehicle


def get_all_vehicles(db: Session):
    return db.query(Vehicle).all()


def get_vehicle_by_id(db: Session, vehicle_id: int):
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()


def update_vehicle(db: Session, vehicle_id: int, vehicle: VehicleUpdate):
    db_vehicle = get_vehicle_by_id(db, vehicle_id)

    if not db_vehicle:
        return None

    update_data = vehicle.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_vehicle, key, value)

    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle


def delete_vehicle(db: Session, vehicle_id: int):
    vehicle = get_vehicle_by_id(db, vehicle_id)

    if not vehicle:
        return None

    db.delete(vehicle)
    db.commit()

    return vehicle


# ==========================================
# PURCHASE VEHICLE
# ==========================================

def purchase_vehicle(db: Session, vehicle_id: int):
    vehicle = get_vehicle_by_id(db, vehicle_id)

    if not vehicle:
        return None

    if vehicle.quantity <= 0:
        return "Out of Stock"

    vehicle.quantity -= 1

    db.commit()
    db.refresh(vehicle)

    return vehicle


# ==========================================
# RESTOCK VEHICLE
# ==========================================

def restock_vehicle(db: Session, vehicle_id: int, quantity: int):
    vehicle = get_vehicle_by_id(db, vehicle_id)

    if not vehicle:
        return None

    vehicle.quantity += quantity

    db.commit()
    db.refresh(vehicle)

    return vehicle


# ==========================================
# SEARCH VEHICLES
# ==========================================

def search_vehicles(db: Session, keyword: str):
    return db.query(Vehicle).filter(
        or_(
            Vehicle.make.ilike(f"%{keyword}%"),
            Vehicle.model.ilike(f"%{keyword}%"),
            Vehicle.category.ilike(f"%{keyword}%")
        )
    ).all()