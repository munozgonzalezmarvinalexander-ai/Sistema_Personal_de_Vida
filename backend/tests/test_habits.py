def test_list_seed_habits(auth_client):
    res = auth_client.get("/api/habits")
    assert res.status_code == 200
    assert len(res.json()) == 8


def test_create_habit(auth_client):
    res = auth_client.post("/api/habits", json={
        "name": "Custom Habit",
        "category": "otro",
        "level_min": "1 min",
        "level_normal": "5 min",
        "level_ideal": "10 min",
        "is_core": False,
    })
    assert res.status_code == 201
    assert res.json()["name"] == "Custom Habit"


def test_toggle_habit(auth_client):
    habits = auth_client.get("/api/habits").json()
    hid = habits[0]["id"]
    res = auth_client.patch(f"/api/habits/{hid}/toggle")
    assert res.status_code == 200
    assert res.json()["active"] is False
    res2 = auth_client.patch(f"/api/habits/{hid}/toggle")
    assert res2.json()["active"] is True


def test_no_access_other_user_habits(auth_client, second_client):
    habits = auth_client.get("/api/habits").json()
    hid = habits[0]["id"]
    res = second_client.get(f"/api/habits/{hid}")
    assert res.status_code == 404
