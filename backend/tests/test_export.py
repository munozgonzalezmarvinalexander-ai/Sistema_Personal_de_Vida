import json
from datetime import date


def test_export_json(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 4})
    res = auth_client.get("/api/export/json")
    assert res.status_code == 200
    data = json.loads(res.content)
    assert data["version"] == "1.0"
    assert "user" in data
    assert "habits" in data
    assert "daily_checkins" in data
    assert len(data["daily_checkins"]) == 1


def test_export_json_no_password(auth_client):
    res = auth_client.get("/api/export/json")
    assert res.status_code == 200
    content = res.content.decode()
    assert "password_hash" not in content


def test_export_csv_checkins(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 4})
    res = auth_client.get("/api/export/csv/checkins")
    assert res.status_code == 200
    lines = res.content.decode().strip().split("\n")
    assert len(lines) == 2
    assert "checkin_date" in lines[0]


def test_export_csv_habits(auth_client):
    res = auth_client.get("/api/export/csv/habits")
    assert res.status_code == 200
    lines = res.content.decode().strip().split("\n")
    assert len(lines) >= 2
    assert "name" in lines[0]


def test_export_csv_experiments(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/experiments", json={
        "title": "Test",
        "hypothesis": "h",
        "metric_tracked": "m",
        "duration_days": 7,
        "start_date": today,
    })
    res = auth_client.get("/api/export/csv/experiments")
    assert res.status_code == 200
    lines = res.content.decode().strip().split("\n")
    assert len(lines) == 2
