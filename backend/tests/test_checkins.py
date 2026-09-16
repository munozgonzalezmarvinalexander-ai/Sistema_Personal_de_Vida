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


def test_points_stay_synced_when_log_changes_or_is_deleted(auth_client):
    today = date.today().isoformat()
    habit_id = auth_client.get("/api/habits").json()[0]["id"]
    checkin = auth_client.post("/api/checkins", json={"checkin_date": today}).json()

    log = auth_client.post("/api/habit-logs", json={
        "habit_id": habit_id, "log_date": today, "level_done": "ideal",
    }).json()
    current = auth_client.get("/api/checkins/today", params={"checkin_date": today}).json()
    assert current["id"] == checkin["id"]
    assert current["points"] == 3

    auth_client.put(f"/api/habit-logs/{log['id']}", json={"level_done": "min"})
    assert auth_client.get("/api/checkins/today", params={"checkin_date": today}).json()["points"] == 1

    deleted = auth_client.delete(f"/api/habit-logs/{log['id']}")
    assert deleted.status_code == 204
    assert auth_client.get("/api/checkins/today", params={"checkin_date": today}).json()["points"] == 0


def test_deleting_habit_resets_affected_checkin_points(auth_client):
    today = date.today().isoformat()
    habit_id = auth_client.get("/api/habits").json()[0]["id"]
    auth_client.post("/api/checkins", json={"checkin_date": today})
    auth_client.post("/api/habit-logs", json={
        "habit_id": habit_id, "log_date": today, "level_done": "normal",
    })
    assert auth_client.get("/api/checkins/today").json()["points"] == 2
    assert auth_client.delete(f"/api/habits/{habit_id}").status_code == 204
    assert auth_client.get("/api/checkins/today").json()["points"] == 0
