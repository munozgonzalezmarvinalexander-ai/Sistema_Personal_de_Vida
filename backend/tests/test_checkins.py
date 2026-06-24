from datetime import date


def test_create_checkin(auth_client):
    today = date.today().isoformat()
    res = auth_client.post("/api/checkins", json={
        "checkin_date": today,
        "sleep_hours": 7.5,
        "mood": 4,
        "energy": 3,
        "water_liters": 2.5,
    })
    assert res.status_code == 201
    data = res.json()
    assert data["checkin_date"] == today
    assert data["sleep_hours"] == 7.5
    assert data["mood"] == 4


def test_no_duplicate_checkin(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 3})
    res = auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 4})
    assert res.status_code == 400


def test_update_checkin(auth_client):
    today = date.today().isoformat()
    create = auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 3})
    cid = create.json()["id"]
    res = auth_client.put(f"/api/checkins/{cid}", json={"mood": 5, "note": "updated"})
    assert res.status_code == 200
    assert res.json()["mood"] == 5
    assert res.json()["note"] == "updated"


def test_checkin_points_from_habits(auth_client):
    today = date.today().isoformat()
    habits = auth_client.get("/api/habits").json()
    hid = habits[0]["id"]
    auth_client.post("/api/habit-logs", json={
        "habit_id": hid, "log_date": today, "level_done": "ideal",
    })
    res = auth_client.post("/api/checkins", json={"checkin_date": today})
    assert res.json()["points"] == 3
