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
    habit_id = auth_client.get("/api/habits").json()[0]["id"]
    assert auth_client.put(f"/api/habits/{habit_id}", json={"level_min": "x" * 501}).status_code == 422


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
    assert auth_client.put("/api/reminders/settings", json={"daily_checkin_time": None}).status_code == 422
    assert auth_client.put("/api/reminders/settings", json={"daily_checkin_enabled": None}).status_code == 422
    habit_id = auth_client.get("/api/habits").json()[0]["id"]
    assert auth_client.put(f"/api/habits/{habit_id}", json={"active": None}).status_code == 422


def test_decimal_limits_and_nullable_checkin_fields(auth_client):
    today = date.today().isoformat()
    ok = auth_client.post("/api/checkins", json={"checkin_date": today, "spending": 999999.99})
    assert ok.status_code == 201
    assert auth_client.put(f"/api/checkins/{ok.json()['id']}", json={"spending": None}).status_code == 200
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    assert auth_client.post("/api/checkins", json={"checkin_date": tomorrow, "spending": 1000000}).status_code == 422
    later = (date.today() + timedelta(days=2)).isoformat()
    assert auth_client.post("/api/checkins", json={"checkin_date": later, "spending": 1.001}).status_code == 422


def test_empty_checkin_counts_as_active_day(auth_client):
    today = date.today().isoformat()
    assert auth_client.post("/api/checkins", json={"checkin_date": today}).status_code == 201
    streak = auth_client.get("/api/reports/streaks").json()
    assert streak["total_active_days"] == 1
    assert streak["current_streak"] == 1
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
