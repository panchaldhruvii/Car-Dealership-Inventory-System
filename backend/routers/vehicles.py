from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from schemas import VehicleCreate, VehicleUpdate, VehicleResponse
from crud import (
    create_vehicle,
    get_all_vehicles,
    get_vehicle_by_id,
    update_vehicle,
    delete_vehicle,
    purchase_vehicle,
    restock_vehicle,
    search_vehicles
)
from auth import get_current_user

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


# ==========================================
# Get All Vehicles
# ==========================================
@router.get("/", response_model=list[VehicleResponse])
def all_vehicles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_all_vehicles(db)


# ==========================================
# Get Vehicle By ID
# ==========================================
@router.get("/{vehicle_id}", response_model=VehicleResponse)
def vehicle_by_id(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    vehicle = get_vehicle_by_id(db, vehicle_id)

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    return vehicle


# ==========================================
# Add Vehicle
# ==========================================
@router.post("/", response_model=VehicleResponse)
def add_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return create_vehicle(db, vehicle)


# ==========================================
# Update Vehicle
# ==========================================
@router.put("/{vehicle_id}", response_model=VehicleResponse)
def edit_vehicle(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    updated = update_vehicle(db, vehicle_id, vehicle)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    return updated


# ==========================================
# Delete Vehicle
# ==========================================
@router.delete("/{vehicle_id}")
def remove_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    deleted = delete_vehicle(db, vehicle_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    return {"message": "Vehicle deleted successfully"}


# ==========================================
# Purchase Vehicle
# ==========================================
@router.post("/{vehicle_id}/purchase")
def purchase(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result = purchase_vehicle(db, vehicle_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    if result == "Out of Stock":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle Out of Stock"
        )

    return result


# ==========================================
# Restock Vehicle
# ==========================================
@router.post("/{vehicle_id}/restock")
def restock(
    vehicle_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    vehicle = restock_vehicle(db, vehicle_id, quantity)

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    return vehicle


# ==========================================
# Search Vehicles
# ==========================================
@router.get("/search/{keyword}")
def search(
    keyword: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return search_vehicles(db, keyword)