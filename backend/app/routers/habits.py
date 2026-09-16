from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.habit import Habit
from app.models.habit_library import HabitLibraryItem
from app.models.habit_log import HabitLog
from app.models.user import User
from app.schemas.habit import HabitCreate, HabitUpdate, HabitOut
from app.services.achievements import unlock_achievement
from app.services.points import sync_daily_checkin_points

router = APIRouter(prefix="/habits", tags=["habits"])


@router.get("", response_model=list[HabitOut])
def list_habits(
    active_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Habit).filter(Habit.user_id == current_user.id)
    if active_only:
        q = q.filter(Habit.active.is_(True))
    return q.order_by(Habit.created_at).all()


@router.post("", response_model=HabitOut, status_code=status.HTTP_201_CREATED)
def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.library_item_id:
        library_item = db.query(HabitLibraryItem).filter(
            HabitLibraryItem.id == data.library_item_id,
            HabitLibraryItem.active.is_(True),
        ).first()
        if not library_item:
            raise HTTPException(status_code=400, detail="Elemento de biblioteca invalido")
    habit = Habit(
        user_id=current_user.id,
        **data.model_dump(exclude={"library_item_id"}),
    )
    db.add(habit)
    db.flush()
    unlock_achievement(db, current_user.id, "habit_creator")
    if data.library_item_id:
        unlock_achievement(db, current_user.id, "library_used")
    db.commit()
    db.refresh(habit)
    return habit


@router.get("/{habit_id}", response_model=HabitOut)
def get_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habito no encontrado")
    return habit


@router.put("/{habit_id}", response_model=HabitOut)
def update_habit(
    habit_id: str,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habito no encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(habit, key, value)
    db.commit()
    db.refresh(habit)
    return habit


@router.patch("/{habit_id}/toggle", response_model=HabitOut)
def toggle_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habito no encontrado")
    habit.active = not habit.active
    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habito no encontrado")
    affected_dates = [row[0] for row in db.query(HabitLog.log_date).filter(
        HabitLog.habit_id == habit.id,
        HabitLog.user_id == current_user.id,
    ).distinct().all()]
    db.delete(habit)
    db.flush()
    for affected_date in affected_dates:
        sync_daily_checkin_points(db, current_user.id, affected_date)
    db.commit()
