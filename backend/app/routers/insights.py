import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.daily_checkin import DailyCheckin
from app.models.habit import Habit
from app.models.habit_log import HabitLog
from app.models.experiment import Experiment
from app.models.user import User
from app.schemas.insight import InsightOut, InsightSummaryOut

router = APIRouter(prefix="/insights", tags=["insights"])


def _avg(values: list) -> float | None:
    nums = [v for v in values if v is not None]
    if not nums:
        return None
    return round(sum(float(x) for x in nums) / len(nums), 1)


def _mk(type_: str, title: str, message: str, recommendation: str,
         category: str, priority: str, confidence: str, period: int,
         metric: str, action_label: str | None = None,
         action_target: str | None = None) -> InsightOut:
    return InsightOut(
        id=str(uuid.uuid4())[:8],
        type=type_, title=title, message=message,
        recommendation=recommendation, category=category,
        priority=priority, confidence=confidence,
        period_days=period, related_metric=metric,
        created_from="rules",
        action_label=action_label, action_target=action_target,
    )


def generate_insights(db: Session, user_id: str) -> list[InsightOut]:
    today = date.today()
    insights: list[InsightOut] = []

    for period in [7, 14]:
        start = today - timedelta(days=period - 1)
        checkins = db.query(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.checkin_date >= start,
            DailyCheckin.checkin_date <= today,
        ).all()

        if not checkins:
            if period == 7:
                insights.append(_mk(
                    "no_data", "Sin registros recientes",
                    f"No tienes check-ins en los ultimos {period} dias.",
                    "Registrar tu dia tarda menos de 1 minuto. Cada dato cuenta para ver tu progreso.",
                    "general", "high", "high", period, "checkins",
                    "Registrar hoy", "today",
                ))
            continue

        prev_start = start - timedelta(days=period)
        prev_checkins = db.query(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.checkin_date >= prev_start,
            DailyCheckin.checkin_date < start,
        ).all()

        sleep_avg = _avg([c.sleep_hours for c in checkins])
        prev_sleep = _avg([c.sleep_hours for c in prev_checkins])
        energy_avg = _avg([c.energy for c in checkins])
        mood_avg = _avg([c.mood for c in checkins])
        prev_mood = _avg([c.mood for c in prev_checkins])
        water_avg = _avg([c.water_liters for c in checkins])
        screen_avg = _avg([c.screen_hours for c in checkins])

        if period == 7:
            if sleep_avg is not None and sleep_avg < 6.5:
                insights.append(_mk(
                    "low_sleep", "Sueno por debajo de lo recomendado",
                    f"Tu promedio de sueno esta en {sleep_avg}h en los ultimos 7 dias.",
                    "Prueba acostarte 30 minutos antes esta semana. La rutina nocturna puede ayudar.",
                    "sueno", "high", "medium", 7, "sleep_hours",
                    "Ver recordatorios", "reminders",
                ))
            elif sleep_avg is not None and prev_sleep is not None and sleep_avg > prev_sleep + 0.3:
                insights.append(_mk(
                    "sleep_improved", "Tu sueno esta mejorando",
                    f"Pasaste de {prev_sleep}h a {sleep_avg}h promedio.",
                    "Sigue con lo que estas haciendo. La constancia en sueno tiene impacto en todo lo demas.",
                    "sueno", "low", "medium", 7, "sleep_hours",
                ))

            if energy_avg is not None and energy_avg <= 2.5:
                insights.append(_mk(
                    "low_energy", "Energia baja esta semana",
                    f"Tu energia promedio fue {energy_avg}/5.",
                    "Revisa si estas durmiendo suficiente, tomando agua y comiendo bien. Son los fundamentos.",
                    "bienestar", "high" if energy_avg <= 2 else "medium", "medium", 7, "energy",
                ))

            if mood_avg is not None and mood_avg <= 2.5:
                msg = f"Tu animo promedio fue {mood_avg}/5 esta semana."
                rec = "Intenta incluir actividades que te gusten, caminar o hablar con alguien de confianza."
                if prev_mood is not None and prev_mood <= 2.5:
                    rec += " Si el bajo animo persiste varias semanas, hablar con un profesional puede ser una buena idea."
                insights.append(_mk(
                    "low_mood", "Animo bajo esta semana", msg, rec,
                    "bienestar", "medium", "medium", 7, "mood",
                ))
            elif mood_avg is not None and prev_mood is not None and mood_avg > prev_mood + 0.5:
                insights.append(_mk(
                    "mood_improved", "Tu animo esta subiendo",
                    f"Pasaste de {prev_mood} a {mood_avg} promedio.",
                    "Buen progreso. Observa que habitos coinciden con los dias de mejor animo.",
                    "bienestar", "low", "medium", 7, "mood",
                ))

            if water_avg is not None and water_avg < 1.5:
                insights.append(_mk(
                    "low_water", "Poca agua esta semana",
                    f"Tu promedio de agua fue {water_avg}L.",
                    "Deja una botella visible y toma un vaso al despertar. Pequenos cambios ayudan.",
                    "salud", "medium", "medium", 7, "water_liters",
                ))

            if screen_avg is not None and screen_avg > 5:
                insights.append(_mk(
                    "high_screen", "Mucho tiempo de pantalla",
                    f"Tu promedio fue {screen_avg}h de pantalla.",
                    "Una opcion simple seria dejar el celular fuera de la habitacion la ultima hora del dia.",
                    "bienestar", "medium", "low", 7, "screen_hours",
                ))

        total_eng = sum(c.english_minutes or 0 for c in checkins)
        total_prog = sum(c.programming_minutes or 0 for c in checkins)

        if period == 7:
            if total_eng == 0:
                insights.append(_mk(
                    "no_english", "Sin practica de ingles",
                    "No registraste minutos de ingles esta semana.",
                    "Prueba con solo 10 minutos diarios. Un podcast corto o leer un parrafo cuenta.",
                    "aprendizaje", "medium", "high", 7, "english_minutes",
                    "Explorar biblioteca", "library",
                ))
            elif total_eng > 0 and period == 7:
                prev_eng = sum(c.english_minutes or 0 for c in prev_checkins)
                if total_eng > prev_eng + 20:
                    insights.append(_mk(
                        "english_up", "Mas ingles que la semana pasada",
                        f"Practicaste {total_eng} min vs {prev_eng} min antes.",
                        "Buen ritmo. La constancia diaria es mas efectiva que sesiones largas esporadicas.",
                        "aprendizaje", "low", "high", 7, "english_minutes",
                    ))

            if total_prog == 0:
                insights.append(_mk(
                    "no_programming", "Sin programacion esta semana",
                    "No registraste minutos de programacion.",
                    "Incluso leer codigo 10 minutos cuenta. Avanzar poco es mejor que no avanzar.",
                    "aprendizaje", "medium", "high", 7, "programming_minutes",
                    "Ver habitos", "habits",
                ))

    habit_stats = (
        db.query(
            HabitLog.habit_id,
            func.count(HabitLog.id).label("days"),
        )
        .filter(
            HabitLog.user_id == user_id,
            HabitLog.log_date >= today - timedelta(days=6),
            HabitLog.completed.is_(True),
        )
        .group_by(HabitLog.habit_id)
        .all()
    )
    completed_ids = {h.habit_id: h.days for h in habit_stats}
    active_habits = db.query(Habit).filter(
        Habit.user_id == user_id, Habit.active.is_(True)
    ).all()

    low_habits = sorted(
        [(h, completed_ids.get(h.id, 0)) for h in active_habits],
        key=lambda x: x[1],
    )
    for habit, days in low_habits[:3]:
        if days <= 1:
            insights.append(_mk(
                "low_habit", f"{habit.name}: bajo cumplimiento",
                f"Solo completaste {habit.name} {days} de 7 dias.",
                f"Prueba bajar al nivel minimo durante esta semana. No necesitas hacerlo perfecto.",
                "habitos", "medium", "high", 7, "habits",
                "Ver habitos", "habits",
            ))

    active_exps = db.query(Experiment).filter(
        Experiment.user_id == user_id, Experiment.status == "active"
    ).all()

    for exp in active_exps:
        days_left = (exp.end_date - today).days
        if days_left <= 2 and days_left >= 0:
            insights.append(_mk(
                "exp_ending", f"Experimento por terminar: {exp.title}",
                f"Tu experimento '{exp.title}' termina en {days_left} dias.",
                "Revisalo y decide: adoptar, ajustar o descartar. Aprender del resultado es lo valioso.",
                "experimentos", "high", "high", exp.duration_days, "experiments",
                "Ver experimentos", "experiments",
            ))

    if not active_exps:
        insights.append(_mk(
            "no_experiments", "Sin experimentos activos",
            "No tienes ningun experimento en curso.",
            "Prueba un habito nuevo durante 7 o 14 dias. La Biblioteca tiene opciones investigadas.",
            "experimentos", "low", "high", 7, "experiments",
            "Explorar biblioteca", "library",
        ))

    return insights


@router.get("", response_model=list[InsightOut])
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_insights(db, current_user.id)


@router.get("/summary", response_model=InsightSummaryOut)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_insights = generate_insights(db, current_user.id)
    high = sum(1 for i in all_insights if i.priority == "high")
    medium = sum(1 for i in all_insights if i.priority == "medium")
    low = sum(1 for i in all_insights if i.priority == "low")

    best = None
    attention = None
    for i in all_insights:
        if i.priority == "low" and i.type.endswith("_improved") or i.type.endswith("_up"):
            best = i.related_metric
        if i.priority == "high":
            attention = i.related_metric

    if high == 0 and medium == 0:
        msg = "Todo se ve bien. Sigue con tu ritmo actual."
    elif high >= 2:
        msg = "Hay algunas areas que podrian necesitar atencion esta semana."
    else:
        msg = "Tienes algunas sugerencias para mejorar tu semana."

    return InsightSummaryOut(
        total=len(all_insights), high_priority=high,
        medium_priority=medium, low_priority=low,
        best_metric=best, needs_attention=attention,
        general_message=msg,
    )
