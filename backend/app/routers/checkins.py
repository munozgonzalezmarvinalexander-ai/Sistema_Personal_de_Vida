from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dates import today_local
from app.core.deps import get_current_user
from app.models.daily_checkin import DailyCheckin
from app.models.user import User
from app.schemas.daily_checkin import DailyCheckinCreate, DailyCheckinUpdate, DailyCheckinOut
from app.services.points import daily_habit_points

router = APIRouter(prefix="/checkins", tags=["checkins"])


def _calc_points(checkin: DailyCheckin, db: Session) -> int:
    return daily_habit_points(db, checkin.user_id, checkin.checkin_date)


@router.get("/today", response_model=DailyCheckinOut | None)
def get_today(
    checkin_date: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requested_date = checkin_date or today_local()
    return (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.user_id == current_user.id,
            DailyCheckin.checkin_date == requested_date,
        )
        .first()
    )


@router.get("", response_model=list[DailyCheckinOut])
def list_checkins(
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(DailyCheckin).filter(DailyCheckin.user_id == current_user.id)
    if start_date:
        q = q.filter(DailyCheckin.checkin_date >= start_date)
    if end_date:
        q = q.filter(DailyCheckin.checkin_date <= end_date)
    return q.order_by(DailyCheckin.checkin_date.desc()).all()


@router.post("", response_model=DailyCheckinOut, status_code=status.HTTP_201_CREATED)
def create_checkin(
    data: DailyCheckinCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == current_user.id, DailyCheckin.checkin_date == data.checkin_date)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un check-in para esta fecha")
    checkin = DailyCheckin(user_id=current_user.id, **data.model_dump())
    db.add(checkin)
    db.flush()
    checkin.points = _calc_points(checkin, db)
    db.commit()
    db.refresh(checkin)
    return checkin


@router.put("/{checkin_id}", response_model=DailyCheckinOut)
def update_checkin(
    checkin_id: str,
    data: DailyCheckinUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    checkin = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.id == checkin_id, DailyCheckin.user_id == current_user.id)
        .first()
    )
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in no encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(checkin, key, value)
    checkin.points = _calc_points(checkin, db)
    db.commit()
    db.refresh(checkin)
    return checkin
