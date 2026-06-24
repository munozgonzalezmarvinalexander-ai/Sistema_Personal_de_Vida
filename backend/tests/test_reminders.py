def test_get_defaults(auth_client):
    res = auth_client.get("/api/reminders/settings")
    assert res.status_code == 200
    data = res.json()
    assert data["daily_checkin_enabled"] is True
    assert data["daily_checkin_time"] == "20:30"
    assert data["evening_shutdown_enabled"] is True
    assert data["weekly_review_day"] == "sunday"
    assert data["habit_nudge_enabled"] is False


def test_update_settings(auth_client):
    res = auth_client.put("/api/reminders/settings", json={
        "daily_checkin_time": "21:00",
        "evening_shutdown_enabled": False,
    })
    assert res.status_code == 200
    assert res.json()["daily_checkin_time"] == "21:00"
    assert res.json()["evening_shutdown_enabled"] is False


def test_persistence(auth_client):
    auth_client.put("/api/reminders/settings", json={"habit_nudge_enabled": True})
    res = auth_client.get("/api/reminders/settings")
    assert res.json()["habit_nudge_enabled"] is True
