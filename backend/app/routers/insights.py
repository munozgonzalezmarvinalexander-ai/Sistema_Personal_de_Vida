import math
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.daily_checkin import DailyCheckin
from app.models.habit import Habit
from app.models.habit_log import HabitLog
from app.models.experiment import Experiment
from app.models.user import User
from app.schemas.insight import InsightOut, InsightSummaryOut, CorrelationOut, CorrelationsResponse

router = APIRouter(prefix="/insights", tags=["insights"])


def _avg(values: list) -> float | None:
    nums = [v for v in values if v is not None]
    if not nums:
        return None
    return round(sum(float(x) for x in nums) / len(nums), 1)


def _mk(type_: str, title: str, message: str, recommendation: str,
         category: str, priority: str, confidence: str, period: int,
         metric: str, action_label: str | None = None,
         action_target: str | None = None,
         created_from: str = "rules") -> InsightOut:
    return InsightOut(
        id=str(uuid.uuid4())[:8],
        type=type_, title=title, message=message,
        recommendation=recommendation, category=category,
        priority=priority, confidence=confidence,
        period_days=period, related_metric=metric,
        created_from=created_from,
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


METRIC_LABELS = {
    "sleep_hours": "Horas de sueno",
    "sleep_quality": "Calidad de sueno",
    "water_liters": "Litros de agua",
    "mood": "Animo",
    "energy": "Energia",
    "food_quality": "Calidad de comida",
    "screen_hours": "Horas de pantalla",
    "university_study_minutes": "Estudio universitario",
    "english_minutes": "Ingles",
    "programming_minutes": "Programacion",
    "reading_minutes": "Lectura",
    "meditation_minutes": "Meditacion",
    "points": "Puntos del dia",
}

CORRELATION_METRICS = list(METRIC_LABELS.keys())

POSITIVE_TEMPLATES = [
    "Tu {y} suele ser mas alta los dias que registras mas {x}.",
    "Los dias con mas {x} parecen coincidir con mejor {y}.",
    "Tu {x} parece relacionarse positivamente con tu {y}.",
]

NEGATIVE_TEMPLATES = [
    "Tu {y} parece bajar los dias con mas {x}.",
    "Los dias con mas {x} suelen coincidir con menor {y}.",
    "Tu {x} parece relacionarse negativamente con tu {y}.",
]

RECOMMENDATIONS = {
    ("sleep_hours", "energy"): "Observa si dormir mas de 7 horas mejora tu energia al dia siguiente.",
    ("sleep_hours", "mood"): "El sueno es uno de los factores mas influyentes en el animo. Prueba una semana con horario fijo.",
    ("sleep_quality", "energy"): "La calidad del sueno podria importar tanto como la cantidad. Revisa tu rutina nocturna.",
    ("sleep_quality", "mood"): "Mejorar la calidad de sueno podria tener impacto en tu animo.",
    ("water_liters", "energy"): "La hidratacion podria estar influyendo en tu energia. Prueba tomar mas agua una semana.",
    ("screen_hours", "mood"): "Reducir pantalla podria mejorar tu animo. Prueba un dia sin pantalla extra.",
    ("screen_hours", "sleep_quality"): "Menos pantalla antes de dormir podria mejorar tu calidad de sueno.",
    ("programming_minutes", "points"): "Los dias con programacion suelen sumar mas puntos. Mantener la constancia ayuda.",
    ("meditation_minutes", "mood"): "La meditacion podria estar ayudando a tu animo. Observa si es consistente.",
    ("meditation_minutes", "energy"): "Observa si meditar regularmente coincide con mejor energia.",
}

DEFAULT_RECOMMENDATION = "Observa este patron durante una semana mas para confirmar si se mantiene."


def _pearson(xs: list[float], ys: list[float]) -> float | None:
    n = len(xs)
    if n < 7:
        return None
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den_x = math.sqrt(sum((x - mean_x) ** 2 for x in xs))
    den_y = math.sqrt(sum((y - mean_y) ** 2 for y in ys))
    if den_x == 0 or den_y == 0:
        return None
    return num / (den_x * den_y)


def _strength(r: float) -> str:
    a = abs(r)
    if a >= 0.7:
        return "strong"
    if a >= 0.4:
        return "moderate"
    return "weak"


def _confidence(sample: int, strength: str) -> str:
    if sample >= 21 and strength in ("strong", "moderate"):
        return "high"
    if sample >= 14:
        return "medium"
    return "low"


def _message(metric_x: str, metric_y: str, direction: str) -> str:
    lx = METRIC_LABELS[metric_x].lower()
    ly = METRIC_LABELS[metric_y].lower()
    templates = POSITIVE_TEMPLATES if direction == "positive" else NEGATIVE_TEMPLATES
    idx = hash(metric_x + metric_y) % len(templates)
    return templates[idx].format(x=lx, y=ly)


def _recommendation(metric_x: str, metric_y: str) -> str:
    key = (metric_x, metric_y)
    rev = (metric_y, metric_x)
    return RECOMMENDATIONS.get(key, RECOMMENDATIONS.get(rev, DEFAULT_RECOMMENDATION))


def compute_correlations(db: Session, user_id: str, days: int) -> CorrelationsResponse:
    today = date.today()
    start = today - timedelta(days=days - 1)
    checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == user_id,
        DailyCheckin.checkin_date >= start,
        DailyCheckin.checkin_date <= today,
    ).all()

    if len(checkins) < 7:
        return CorrelationsResponse(
            days=days, sample_size=len(checkins), correlations=[],
            message="Necesitas al menos 7 dias con datos para detectar patrones confiables.",
        )

    rows: dict[str, list[float | None]] = {m: [] for m in CORRELATION_METRICS}
    for c in checkins:
        for m in CORRELATION_METRICS:
            rows[m].append(getattr(c, m, None))

    results: list[CorrelationOut] = []
    seen: set[tuple[str, str]] = set()

    for i, mx in enumerate(CORRELATION_METRICS):
        for my in CORRELATION_METRICS[i + 1:]:
            if (mx, my) in seen:
                continue
            seen.add((mx, my))

            pairs = [
                (float(x), float(y))
                for x, y in zip(rows[mx], rows[my])
                if x is not None and y is not None
            ]
            if len(pairs) < 7:
                continue

            xs, ys = zip(*pairs)
            r = _pearson(list(xs), list(ys))
            if r is None:
                continue

            s = _strength(r)
            if s == "weak":
                continue

            direction = "positive" if r > 0 else "negative"
            conf = _confidence(len(pairs), s)

            results.append(CorrelationOut(
                id=str(uuid.uuid4())[:8],
                metric_x=mx, metric_y=my,
                label_x=METRIC_LABELS[mx], label_y=METRIC_LABELS[my],
                coefficient=round(r, 3),
                strength=s, direction=direction,
                sample_size=len(pairs),
                message=_message(mx, my, direction),
                recommendation=_recommendation(mx, my),
                confidence=conf,
            ))

    results.sort(key=lambda c: abs(c.coefficient), reverse=True)

    if results:
        msg = f"Se encontraron {len(results)} patrones en tus ultimos {days} dias."
    else:
        msg = "No se detectaron patrones significativos en este periodo. Sigue registrando datos."

    return CorrelationsResponse(
        days=days, sample_size=len(checkins),
        correlations=results, message=msg,
    )


def _correlation_insights(db: Session, user_id: str) -> list[InsightOut]:
    resp = compute_correlations(db, user_id, 30)
    out: list[InsightOut] = []
    for corr in resp.correlations[:2]:
        if corr.strength not in ("moderate", "strong"):
            continue
        out.append(_mk(
            "correlation", f"Patron: {corr.label_x} y {corr.label_y}",
            corr.message, corr.recommendation,
            "general", "low", corr.confidence, 30,
            corr.metric_x,
            created_from="correlation_rules",
        ))
    return out


@router.get("/correlations", response_model=CorrelationsResponse)
def get_correlations(
    days: int = Query(30, ge=14, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return compute_correlations(db, current_user.id, days)


@router.get("", response_model=list[InsightOut])
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    insights = generate_insights(db, current_user.id)
    insights.extend(_correlation_insights(db, current_user.id))
    return insights


@router.get("/summary", response_model=InsightSummaryOut)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_insights = generate_insights(db, current_user.id)
    all_insights.extend(_correlation_insights(db, current_user.id))
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
