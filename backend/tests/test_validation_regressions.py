from datetime import date, timedelta


def test_rejects_blank_and_null_habit_fields(auth_client):
    base = {
        "name": "Valido",
        "category": "otro",
        "level_min": "1",
        "level_normal": "2",
        "level_ideal": "3",
    }
    assert auth_client.post("/api/habits", json={**base, "name": "   "}).status_code == 422
    assert auth_client.post("/api/habits", json={**base, "category": None}).status_code == 422


def test_rejects_bcrypt_password_over_72_bytes(client):
    response = client.post("/api/auth/register", json={
        "email": "long@example.com",
        "password": "á" * 40,
        "display_name": "Long Password",
    })
    assert response.status_code == 422


def test_rejects_invalid_time_and_metric_ranges(auth_client):
    assert auth_client.put("/api/reminders/settings", json={
        "daily_checkin_time": "24:61",
    }).status_code == 422
    assert auth_client.post("/api/checkins", json={
        "checkin_date": date.today().isoformat(),
        "english_minutes": 1441,
    }).status_code == 422


def test_weekly_rankings_include_zero_log_habits(auth_client):
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    response = auth_client.get("/api/reports/weekly", params={
        "start_date": monday.isoformat(),
    })
    assert response.status_code == 200
    least = response.json()["habits_least_completed"]
    assert least
    assert all(item["days_completed"] == 0 for item in least)
