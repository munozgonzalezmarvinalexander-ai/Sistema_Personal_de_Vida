import pytest
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
