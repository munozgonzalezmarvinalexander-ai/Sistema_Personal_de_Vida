from datetime import date


def test_no_data_insight(auth_client):
    res = auth_client.get("/api/insights")
    assert res.status_code == 200
    types = [i["type"] for i in res.json()]
    assert "no_data" in types


def test_low_sleep_insight(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={
        "checkin_date": today,
        "sleep_hours": 5.0,
        "mood": 4,
        "energy": 4,
    })
    res = auth_client.get("/api/insights")
    types = [i["type"] for i in res.json()]
    assert "low_sleep" in types


def test_low_water_insight(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={
        "checkin_date": today,
        "water_liters": 0.5,
    })
    res = auth_client.get("/api/insights")
    types = [i["type"] for i in res.json()]
    assert "low_water" in types


def test_summary(auth_client):
    res = auth_client.get("/api/insights/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "general_message" in data
    assert "high_priority" in data


def test_no_external_api(auth_client):
    today = date.today().isoformat()
    auth_client.post("/api/checkins", json={"checkin_date": today, "mood": 4})
    res = auth_client.get("/api/insights")
    for insight in res.json():
        assert insight["created_from"] == "rules"
