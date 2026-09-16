def test_register(client):
    res = client.post("/api/auth/register", json={
        "email": "new@example.com",
        "password": "pass123456",
        "display_name": "New User",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new@example.com"
    assert data["user"]["display_name"] == "New User"


def test_register_duplicate_email(auth_client):
    res = auth_client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "pass123456",
        "display_name": "Dup",
    })
    assert res.status_code == 400


def test_login_correct(auth_client, client):
    res = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "test123456",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(auth_client, client):
    res = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_me_with_token(auth_client):
    res = auth_client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


def test_me_without_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_register_rolls_back_user_when_initial_habits_fail(client, monkeypatch):
    from app.models.user import User
    from tests.conftest import TestSession

    def fail_seed(db, user_id):
        raise RuntimeError("seed failed")

    monkeypatch.setattr("app.routers.auth.seed_habits", fail_seed)
    try:
        client.post("/api/auth/register", json={
            "email": "atomic@example.com", "password": "pass123456", "display_name": "Atomic",
        })
    except RuntimeError:
        pass
    with TestSession() as db:
        assert db.query(User).filter(User.email == "atomic@example.com").first() is None
