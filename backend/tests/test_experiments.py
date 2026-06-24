from datetime import date


def test_create_experiment(auth_client):
    today = date.today().isoformat()
    res = auth_client.post("/api/experiments", json={
        "title": "Test Exp",
        "hypothesis": "It helps",
        "metric_tracked": "Mood",
        "duration_days": 7,
        "start_date": today,
    })
    assert res.status_code == 201
    assert res.json()["status"] == "active"
    assert res.json()["duration_days"] == 7


def test_reject_invalid_duration(auth_client):
    today = date.today().isoformat()
    res = auth_client.post("/api/experiments", json={
        "title": "Bad",
        "hypothesis": "test",
        "metric_tracked": "x",
        "duration_days": 10,
        "start_date": today,
    })
    assert res.status_code == 422


def test_complete_experiment(auth_client):
    today = date.today().isoformat()
    create = auth_client.post("/api/experiments", json={
        "title": "Complete me",
        "hypothesis": "test",
        "metric_tracked": "Mood",
        "duration_days": 7,
        "start_date": today,
    })
    eid = create.json()["id"]
    res = auth_client.patch(f"/api/experiments/{eid}/complete", json={
        "result": "It worked",
        "decision": "adopt",
    })
    assert res.status_code == 200
    assert res.json()["status"] == "completed"
    assert res.json()["decision"] == "adopt"


def test_cancel_experiment(auth_client):
    today = date.today().isoformat()
    create = auth_client.post("/api/experiments", json={
        "title": "Cancel me",
        "hypothesis": "test",
        "metric_tracked": "x",
        "duration_days": 14,
        "start_date": today,
    })
    eid = create.json()["id"]
    res = auth_client.patch(f"/api/experiments/{eid}/cancel")
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"


def test_cannot_complete_cancelled(auth_client):
    today = date.today().isoformat()
    create = auth_client.post("/api/experiments", json={
        "title": "Bad flow",
        "hypothesis": "test",
        "metric_tracked": "x",
        "duration_days": 7,
        "start_date": today,
    })
    eid = create.json()["id"]
    auth_client.patch(f"/api/experiments/{eid}/cancel")
    res = auth_client.patch(f"/api/experiments/{eid}/complete", json={
        "result": "x", "decision": "adopt",
    })
    assert res.status_code == 400


def test_no_access_other_user_experiment(auth_client, second_client):
    today = date.today().isoformat()
    create = auth_client.post("/api/experiments", json={
        "title": "Private",
        "hypothesis": "test",
        "metric_tracked": "x",
        "duration_days": 7,
        "start_date": today,
    })
    eid = create.json()["id"]
    res = second_client.get(f"/api/experiments/{eid}")
    assert res.status_code == 404
