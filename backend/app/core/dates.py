from datetime import date, datetime
from zoneinfo import ZoneInfo


APP_TIMEZONE = ZoneInfo("America/Guatemala")


def today_local() -> date:
    return datetime.now(APP_TIMEZONE).date()
