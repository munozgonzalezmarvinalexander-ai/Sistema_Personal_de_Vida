from sqlalchemy.orm import Session

from app.models.habit import Habit

DEFAULT_HABITS = [
    {
        "name": "Sueno",
        "category": "salud",
        "level_min": "Acostarte a hora decente",
        "level_normal": "7 horas de sueno",
        "level_ideal": "7.5-8 h + misma hora de dormir/despertar",
        "is_core": True,
    },
    {
        "name": "Agua",
        "category": "salud",
        "level_min": "Llenar botella 2 veces",
        "level_normal": "~2.5 L distribuidos",
        "level_ideal": "~3 L + sin bebidas azucaradas",
        "is_core": True,
    },
    {
        "name": "Ejercicio",
        "category": "salud",
        "level_min": "Caminar 10 min",
        "level_normal": "Entreno o caminata larga",
        "level_ideal": "Entreno completo + caminata",
        "is_core": True,
    },
    {
        "name": "Ingles",
        "category": "aprendizaje",
        "level_min": "Escuchar algo 10 min",
        "level_normal": "15 min input",
        "level_ideal": "20 min input + output",
        "is_core": True,
    },
    {
        "name": "Programacion",
        "category": "aprendizaje",
        "level_min": "Leer codigo 10 min",
        "level_normal": "30 min en tu proyecto",
        "level_ideal": "60 min con objetivo claro",
        "is_core": False,
    },
    {
        "name": "Lectura",
        "category": "desarrollo",
        "level_min": "1 pagina",
        "level_normal": "10-15 min",
        "level_ideal": "20-30 min + nota",
        "is_core": False,
    },
    {
        "name": "Meditacion",
        "category": "bienestar",
        "level_min": "3 respiraciones",
        "level_normal": "5 min",
        "level_ideal": "10 min",
        "is_core": False,
    },
    {
        "name": "Celular nocturno",
        "category": "bienestar",
        "level_min": "No redes la ultima hora",
        "level_normal": "Limites activos en apps",
        "level_ideal": "Sin redes manana y noche",
        "is_core": True,
    },
]


def seed_habits(db: Session, user_id: str):
    existing = db.query(Habit).filter(Habit.user_id == user_id).count()
    if existing > 0:
        return
    for h in DEFAULT_HABITS:
        db.add(Habit(user_id=user_id, **h))
    db.commit()
