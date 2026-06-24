from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.habit_library import HabitLibraryItem
from app.models.user import User
from app.schemas.habit_library import HabitLibraryOut

router = APIRouter(prefix="/habit-library", tags=["habit-library"])


@router.get("", response_model=list[HabitLibraryOut])
def list_library(
    category: str | None = None,
    evidence_type: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(HabitLibraryItem).filter(HabitLibraryItem.active.is_(True))
    if category:
        q = q.filter(HabitLibraryItem.category == category)
    if evidence_type and evidence_type in ("science", "tradition", "personal"):
        q = q.filter(HabitLibraryItem.evidence_type == evidence_type)
    if difficulty and difficulty in ("low", "medium", "high"):
        q = q.filter(HabitLibraryItem.difficulty == difficulty)
    if search:
        term = f"%{search}%"
        q = q.filter(
            HabitLibraryItem.name.ilike(term)
            | HabitLibraryItem.description.ilike(term)
            | HabitLibraryItem.benefit.ilike(term)
        )
    return q.order_by(HabitLibraryItem.category, HabitLibraryItem.name).all()


@router.get("/{item_id}", response_model=HabitLibraryOut)
def get_library_item(
    item_id: str,
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(HabitLibraryItem).filter(HabitLibraryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Elemento no encontrado")
    return item
