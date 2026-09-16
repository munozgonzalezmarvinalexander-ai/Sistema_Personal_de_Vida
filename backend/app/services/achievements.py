from sqlalchemy.orm import Session

from app.models.achievement import Achievement


ACHIEVEMENT_DEFS = [
    {"code": "first_checkin", "title": "Primer registro", "description": "Completaste tu primer check-in diario.", "icon": "calendar-check", "category": "inicio"},
    {"code": "three_day_return", "title": "Volviste al camino", "description": "Registraste actividad despues de un dia sin registro.", "icon": "rotate-ccw", "category": "constancia"},
    {"code": "seven_checkins", "title": "Primera semana consciente", "description": "Completaste 7 check-ins.", "icon": "calendar", "category": "constancia"},
    {"code": "habit_creator", "title": "Disenador de habitos", "description": "Creaste tu primer habito personalizado.", "icon": "pencil", "category": "inicio"},
    {"code": "experiment_started", "title": "Mentalidad experimental", "description": "Creaste tu primer experimento personal.", "icon": "flask-conical", "category": "aprendizaje"},
    {"code": "experiment_completed", "title": "Aprendiste con datos", "description": "Completaste tu primer experimento.", "icon": "check-circle", "category": "aprendizaje"},
    {"code": "library_used", "title": "Explorador de practicas", "description": "Creaste un habito o experimento desde la Biblioteca.", "icon": "book-marked", "category": "aprendizaje"},
    {"code": "streak_7", "title": "Constancia flexible", "description": "Alcanzaste una racha de 7 dias.", "icon": "flame", "category": "constancia"},
    {"code": "hundred_points", "title": "100 puntos de progreso", "description": "Acumulaste 100 puntos en total.", "icon": "star", "category": "progreso"},
    {"code": "balanced_day", "title": "Dia equilibrado", "description": "Registraste sueno, agua, animo, energia y al menos un habito en un dia.", "icon": "scale", "category": "bienestar"},
]

ACHIEVEMENT_MAP = {item["code"]: item for item in ACHIEVEMENT_DEFS}


def unlock_achievement(db: Session, user_id: str, code: str) -> str | None:
    if code not in ACHIEVEMENT_MAP:
        raise ValueError(f"Unknown achievement code: {code}")
    existing = db.query(Achievement).filter(
        Achievement.user_id == user_id,
        Achievement.code == code,
    ).first()
    if existing:
        return None
    definition = ACHIEVEMENT_MAP[code]
    db.add(Achievement(
        user_id=user_id,
        code=code,
        title=definition["title"],
        description=definition["description"],
        icon=definition["icon"],
        category=definition["category"],
    ))
    return code
