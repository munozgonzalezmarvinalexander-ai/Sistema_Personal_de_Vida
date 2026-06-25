from datetime import date, timedelta


def _create_checkins(client, days_data):
    for offset, data in enumerate(days_data):
        d = (date.today() - timedelta(days=len(days_data) - 1 - offset)).isoformat()
        client.post("/api/checkins", json={"checkin_date": d, **data})


def test_insufficient_data(auth_client):
    res = auth_client.get("/api/insights/correlations?days=30")
    assert res.status_code == 200
    data = res.json()
    assert data["correlations"] == []
    assert "al menos 7" in data["message"]


def test_insufficient_with_few_days(auth_client):
    for i in range(3):
        d = (date.today() - timedelta(days=i)).isoformat()
        auth_client.post("/api/checkins", json={
            "checkin_date": d, "sleep_hours": 7, "energy": 4,
        })
    res = auth_client.get("/api/insights/correlations?days=14")
    assert res.json()["sample_size"] == 3
    assert res.json()["correlations"] == []


def test_strong_positive_correlation(auth_client):
    energies = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]
    data = []
    for i in range(10):
        data.append({"sleep_hours": 5.0 + i * 0.5, "energy": energies[i], "mood": 3})
    _create_checkins(auth_client, data)

    res = auth_client.get("/api/insights/correlations?days=30")
    assert res.status_code == 200
    corrs = res.json()["correlations"]
    found = [c for c in corrs if
             {c["metric_x"], c["metric_y"]} == {"sleep_hours", "energy"}]
    assert len(found) == 1
    assert found[0]["direction"] == "positive"
    assert found[0]["coefficient"] > 0.4


def test_strong_negative_correlation(auth_client):
    moods = [5, 5, 4, 4, 3, 3, 2, 2, 1, 1]
    data = []
    for i in range(10):
        data.append({"screen_hours": 1.0 + i * 0.8, "mood": moods[i], "energy": 3})
    _create_checkins(auth_client, data)

    res = auth_client.get("/api/insights/correlations?days=30")
    corrs = res.json()["correlations"]
    found = [c for c in corrs if
             {c["metric_x"], c["metric_y"]} == {"screen_hours", "mood"}]
    assert len(found) == 1
    assert found[0]["direction"] == "negative"
    assert found[0]["coefficient"] < -0.4


def test_weak_correlations_hidden(auth_client):
    import random
    random.seed(42)
    data = []
    for _ in range(15):
        data.append({
            "sleep_hours": random.uniform(5, 9),
            "energy": random.randint(1, 5),
            "mood": random.randint(1, 5),
            "water_liters": random.uniform(0.5, 3),
        })
    _create_checkins(auth_client, data)

    res = auth_client.get("/api/insights/correlations?days=30")
    for c in res.json()["correlations"]:
        assert c["strength"] in ("moderate", "strong")
        assert abs(c["coefficient"]) >= 0.4


def test_user_isolation(auth_client, second_client):
    energies = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]
    data = []
    for i in range(10):
        data.append({"sleep_hours": 5 + i * 0.5, "energy": energies[i]})
    _create_checkins(auth_client, data)

    res_owner = auth_client.get("/api/insights/correlations?days=30")
    res_other = second_client.get("/api/insights/correlations?days=30")

    assert res_owner.status_code == 200
    assert res_other.status_code == 200
    assert len(res_owner.json()["correlations"]) > 0
    assert len(res_other.json()["correlations"]) == 0


def test_correlation_insights_in_main_endpoint(auth_client):
    data = []
    for i in range(10):
        data.append({"sleep_hours": 5 + i * 0.5, "energy": 1 + i * 0.4, "mood": 3})
    _create_checkins(auth_client, data)

    res = auth_client.get("/api/insights")
    assert res.status_code == 200
    corr_insights = [i for i in res.json() if i["created_from"] == "correlation_rules"]
    assert len(corr_insights) <= 2
    for ci in corr_insights:
        assert ci["type"] == "correlation"


def test_days_parameter_validation(auth_client):
    res = auth_client.get("/api/insights/correlations?days=7")
    assert res.status_code == 422
    res = auth_client.get("/api/insights/correlations?days=100")
    assert res.status_code == 422
    res = auth_client.get("/api/insights/correlations?days=60")
    assert res.status_code == 200
