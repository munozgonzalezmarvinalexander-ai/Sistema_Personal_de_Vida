import pytest
from datetime import date
from tests.conftest import TestSession
from app.seed_library import seed_library


@pytest.fixture(autouse=True)
def seed_lib():
    db = TestSession()
    seed_library(db)
    db.close()


def test_list_library(auth_client):
    res = auth_client.get("/api/habit-library")
    assert res.status_code == 200
    assert len(res.json()) == 17


def test_filter_by_evidence(auth_client):
    res = auth_client.get("/api/habit-library?evidence_type=science")
    assert res.status_code == 200
    for item in res.json():
        assert item["evidence_type"] == "science"


def test_filter_by_category(auth_client):
    res = auth_client.get("/api/habit-library?category=sueno")
    assert res.status_code == 200
    for item in res.json():
        assert item["category"] == "sueno"


def test_search(auth_client):
    res = auth_client.get("/api/habit-library?search=medita")
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_post_not_allowed(auth_client):
    res = auth_client.post("/api/habit-library", json={"name": "hack"})
    assert res.status_code == 405


def test_delete_not_allowed(auth_client):
    items = auth_client.get("/api/habit-library").json()
    assert len(items) > 0
    res = auth_client.delete(f"/api/habit-library/{items[0]['id']}")
    assert res.status_code == 405


def test_library_habit_unlocks_achievements_in_same_request(auth_client):
    item = auth_client.get("/api/habit-library").json()[0]
    response = auth_client.post("/api/habits", json={
        "name": f"Biblioteca: {item['name']}",
        "category": item["category"],
        "level_min": "1 min",
        "level_normal": "5 min",
        "level_ideal": "10 min",
        "is_core": False,
        "library_item_id": item["id"],
    })
    assert response.status_code == 201
    unlocked = auth_client.get("/api/gamification/achievements").json()["unlocked"]
    assert {achievement["code"] for achievement in unlocked} >= {"habit_creator", "library_used"}


def test_library_experiment_unlocks_start_and_completion_immediately(auth_client):
    item = auth_client.get("/api/habit-library").json()[0]
    created = auth_client.post("/api/experiments", json={
        "title": f"Prueba: {item['name']}",
        "hypothesis": "Puede ayudar",
        "metric_tracked": "Energia",
        "duration_days": 7,
        "start_date": date.today().isoformat(),
        "library_item_id": item["id"],
    })
    assert created.status_code == 201
    unlocked = auth_client.get("/api/gamification/achievements").json()["unlocked"]
    assert {achievement["code"] for achievement in unlocked} >= {"experiment_started", "library_used"}
    completed = auth_client.patch(f"/api/experiments/{created.json()['id']}/complete", json={
        "result": "Funciono", "decision": "adopt",
    })
    assert completed.status_code == 200
    unlocked = auth_client.get("/api/gamification/achievements").json()["unlocked"]
    assert "experiment_completed" in {achievement["code"] for achievement in unlocked}
