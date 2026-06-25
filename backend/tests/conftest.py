import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only-not-production")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_client(client):
    res = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "test123456",
        "display_name": "Test User",
    })
    token = res.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.fixture
def second_client(client):
    res = client.post("/api/auth/register", json={
        "email": "other@example.com",
        "password": "other123456",
        "display_name": "Other User",
    })
    token = res.json()["access_token"]

    class SecondClient:
        def __init__(self, base, tok):
            self._base = base
            self._headers = {"Authorization": f"Bearer {tok}"}

        def get(self, url, **kw):
            kw.setdefault("headers", {}).update(self._headers)
            return self._base.get(url, **kw)

        def post(self, url, **kw):
            kw.setdefault("headers", {}).update(self._headers)
            return self._base.post(url, **kw)

    return SecondClient(client, token)
