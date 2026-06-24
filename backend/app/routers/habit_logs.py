from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.habit import Habit
from app.models.habit_log import HabitLog
from app.models.user import User
from app.schemas.habit_log import HabitLogCreate, HabitLogUpdate, HabitLogOut, LEVEL_POINTS

router = APIRouter(prefix="/habit-logs", tags=["habit-logs"])


@router.get("", response_model=list[HabitLogOut])
def list_logs(
    log_date: date | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(HabitLog).filter(HabitLog.user_id == current_user.id)
    if log_date:
        q = q.filter(HabitLog.log_date == log_date)
    return q.all()


@router.post("", response_model=HabitLogOut, status_code=status.HTTP_201_CREATED)
def create_log(
    data: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == data.habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")
    existing = (
        db.query(HabitLog)
        .filter(
            HabitLog.user_id == current_user.id,
            HabitLog.habit_id == data.habit_id,
            HabitLog.log_date == data.log_date,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un registro para este hábito en esta fecha")
    points = LEVEL_POINTS.get(data.level_done.value, 0)
    log = HabitLog(
        user_id=current_user.id,
        habit_id=data.habit_id,
        log_date=data.log_date,
        level_done=data.level_done.value,
        completed=data.level_done.value != "none",
        points=points,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.put("/{log_id}", response_model=HabitLogOut)
def update_log(
    log_id: str,
    data: HabitLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(HabitLog).filter(HabitLog.id == log_id, HabitLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    log.level_done = data.level_done.value
    log.completed = data.level_done.value != "none"
    log.points = LEVEL_POINTS.get(data.level_done.value, 0)
    db.commit()
    db.refresh(log)
    return log
