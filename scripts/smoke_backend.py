"""
Smoke test for Rumbo backend API.
Usage: API_URL=https://your-domain.com/api python scripts/smoke_backend.py
"""
import os
import sys
import uuid
import requests

BASE = os.environ.get("API_URL", "http://localhost:8000/api")
PASSED = 0
FAILED = 0


def check(name: str, ok: bool, detail: str = ""):
    global PASSED, FAILED
    status = "PASS" if ok else "FAIL"
    if ok:
        PASSED += 1
    else:
        FAILED += 1
    suffix = f" — {detail}" if detail else ""
    print(f"  [{status}] {name}{suffix}")


def main():
    print(f"\nRumbo Smoke Test — {BASE}\n{'=' * 50}")

    # 1. Health
    print("\n1. Health check")
    try:
        r = requests.get(f"{BASE}/health", timeout=10)
        check("GET /health", r.status_code == 200, f"status={r.status_code}")
        check("Response OK", r.json().get("status") == "ok", str(r.json()))
    except Exception as e:
        check("Health reachable", False, str(e))
        print("\nBackend unreachable. Aborting.")
        sys.exit(1)

    # 2. Register
    print("\n2. Register")
    email = f"smoke-{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{BASE}/auth/register", json={
        "email": email,
        "password": "smoketest123",
        "display_name": "Smoke Test",
    }, timeout=10)
    check("POST /auth/register", r.status_code == 201, f"status={r.status_code}")
    token = r.json().get("access_token", "")
    check("Token received", bool(token))
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Login
    print("\n3. Login")
    r = requests.post(f"{BASE}/auth/login", json={
        "email": email,
        "password": "smoketest123",
    }, timeout=10)
    check("POST /auth/login", r.status_code == 200, f"status={r.status_code}")

    # 4. Auth me
    print("\n4. Auth me")
    r = requests.get(f"{BASE}/auth/me", headers=headers, timeout=10)
    check("GET /auth/me", r.status_code == 200)
    check("Email matches", r.json().get("email") == email)

    # 5. Habits
    print("\n5. Habits")
    r = requests.get(f"{BASE}/habits", headers=headers, timeout=10)
    check("GET /habits", r.status_code == 200)
    check("Default habits seeded", len(r.json()) > 0, f"count={len(r.json())}")

    # 6. Checkin
    print("\n6. Check-in")
    from datetime import date
    today = date.today().isoformat()
    r = requests.post(f"{BASE}/checkins", headers=headers, json={
        "checkin_date": today,
        "sleep_hours": 7.5,
        "energy": 4,
        "mood": 4,
        "water_liters": 2.0,
    }, timeout=10)
    check("POST /checkins", r.status_code in (200, 201), f"status={r.status_code}")

    # 7. Insights
    print("\n7. Insights")
    r = requests.get(f"{BASE}/insights", headers=headers, timeout=10)
    check("GET /insights", r.status_code == 200)

    r = requests.get(f"{BASE}/insights/correlations?days=30", headers=headers, timeout=10)
    check("GET /insights/correlations", r.status_code == 200)

    # 8. Export
    print("\n8. Export")
    r = requests.get(f"{BASE}/export/json", headers=headers, timeout=10)
    check("GET /export/json", r.status_code == 200)
    check("No password_hash", "password_hash" not in r.text)

    # 9. Library (read-only)
    print("\n9. Library")
    r = requests.get(f"{BASE}/habit-library", headers=headers, timeout=10)
    check("GET /habit-library", r.status_code == 200)

    # 10. Unauthorized access
    print("\n10. Security")
    r = requests.get(f"{BASE}/habits", timeout=10)
    check("No token → 401", r.status_code == 401)

    # Summary
    total = PASSED + FAILED
    print(f"\n{'=' * 50}")
    print(f"Results: {PASSED}/{total} passed, {FAILED} failed")
    sys.exit(0 if FAILED == 0 else 1)


if __name__ == "__main__":
    main()
