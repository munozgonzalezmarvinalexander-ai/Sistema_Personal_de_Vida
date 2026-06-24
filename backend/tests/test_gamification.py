from datetime import date


def test_initial_progress(auth_client):
    res = auth_client.get("/api/gamification/progress")
    assert res.status_code == 200
    data = res.json()
    assert data["level"] == 1
    assert data["total_points"] == 0
    assert data["total_achievements"] == 0


def test_first_checkin_achievement(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 4})
    res = auth_client.post("/api/gamification/recalculate")
    assert res.status_code == 200
    new = res.json()["new_achievements"]
    assert "first_checkin" in new


def test_no_duplicate_achievements(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 4})
    auth_client.post("/api/gamification/recalculate")
    res2 = auth_client.post("/api/gamification/recalculate")
    assert len(res2.json()["new_achievements"]) == 0


def test_habit_creator_achievement(auth_client):
    auth_client.post("/api/habits", json={
        "name": "Custom", "category": "otro",
        "level_min": "1", "level_normal": "2", "level_ideal": "3", "is_core": False,
    })
    res = auth_client.post("/api/gamification/recalculate")
    assert "habit_creator" in res.json()["new_achievements"]


def test_achievements_list(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 4})
    auth_client.post("/api/gamification/recalculate")
    res = auth_client.get("/api/gamification/achievements")
    assert res.status_code == 200
    data = res.json()
    assert len(data["unlocked"]) >= 1
    assert len(data["available"]) >= 1
    codes = {a["code"] for a in data["unlocked"]}
    assert "first_checkin" in codes
