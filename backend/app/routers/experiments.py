from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.experiment import Experiment
from app.models.user import User
from app.schemas.experiment import (
    ExperimentCreate, ExperimentUpdate, ExperimentComplete, ExperimentOut,
)

router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.get("", response_model=list[ExperimentOut])
def list_experiments(
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Experiment).filter(Experiment.user_id == current_user.id)
    if status_filter and status_filter in ("active", "completed", "cancelled"):
        q = q.filter(Experiment.status == status_filter)
    return q.order_by(Experiment.created_at.desc()).all()


@router.post("", response_model=ExperimentOut, status_code=status.HTTP_201_CREATED)
def create_experiment(
    data: ExperimentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    end_date = data.start_date + timedelta(days=data.duration_days.value - 1)
    exp = Experiment(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        hypothesis=data.hypothesis,
        metric_tracked=data.metric_tracked,
        duration_days=data.duration_days.value,
        start_date=data.start_date,
        end_date=end_date,
        status="active",
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.get("/{experiment_id}", response_model=ExperimentOut)
def get_experiment(
    experiment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id,
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")
    return exp


@router.put("/{experiment_id}", response_model=ExperimentOut)
def update_experiment(
    experiment_id: str,
    data: ExperimentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id,
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")
    if exp.status != "active":
        raise HTTPException(status_code=400, detail="Solo se puede editar un experimento activo")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(exp, key, value)
    db.commit()
    db.refresh(exp)
    return exp


@router.patch("/{experiment_id}/complete", response_model=ExperimentOut)
def complete_experiment(
    experiment_id: str,
    data: ExperimentComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id,
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")
    if exp.status != "active":
        raise HTTPException(status_code=400, detail="Solo se puede completar un experimento activo")
    exp.status = "completed"
    exp.result = data.result
    exp.decision = data.decision.value
    db.commit()
    db.refresh(exp)
    return exp


@router.patch("/{experiment_id}/cancel", response_model=ExperimentOut)
def cancel_experiment(
    experiment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id,
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")
    if exp.status != "active":
        raise HTTPException(status_code=400, detail="Solo se puede cancelar un experimento activo")
    exp.status = "cancelled"
    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(
    experiment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp = db.query(Experiment).filter(
        Experiment.id == experiment_id,
        Experiment.user_id == current_user.id,
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")
    db.delete(exp)
    db.commit()
