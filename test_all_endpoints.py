import json
import urllib.request
import urllib.error
import sys
import time

BASE_URL = "http://localhost:5180"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            content_type = resp.headers.get("Content-Type", "")
            if "pdf" in content_type or "spreadsheet" in content_type or "octet-stream" in content_type:
                return resp.status, f"Binary ({len(content)} bytes)"
            try:
                text = content.decode("utf-8") if content else ""
            except:
                return resp.status, f"Binary ({len(content)} bytes)"
            try:
                res_data = json.loads(text) if text else None
            except:
                res_data = text
            return resp.status, res_data
    except urllib.error.HTTPError as e:
        err_content = e.read()
        try:
            err_data = json.loads(err_content.decode("utf-8"))
        except:
            err_data = err_content.decode("utf-8", errors="replace")
        return e.code, err_data
    except Exception as e:
        return 0, str(e)

results = []
def check(name, method, path, expected_status, status, data):
    ok = (status in expected_status) if isinstance(expected_status, list) else (status == expected_status)
    results.append((name, method, path, status, ok, str(data)[:100] if not ok else ""))
    icon = "✓" if ok else "✗"
    print(f"[{icon}] {name:35} {method:6} {path:40} Status: {status}")
    if not ok:
        print(f"    ERROR DETAILS: {data}")

# 1. Login
status, data = request("POST", "/api/auth/login", {"email": "bora.varol@wamturkey.com", "password": "admin123"})
check("Auth Login", "POST", "/api/auth/login", 200, status, data)
token = data.get("token") if status == 200 and isinstance(data, dict) else None

if not token:
    print("Cannot obtain token, aborting suite.")
    sys.exit(1)

# 2. Auth Me
status, data = request("GET", "/api/auth/me", token=token)
check("Auth Me", "GET", "/api/auth/me", 200, status, data)

# 3. Lookups
status, data = request("GET", "/api/lookup", token=token)
check("Lookup GetAll", "GET", "/api/lookup", 200, status, data)

# 4. Projects CRUD
status, data = request("GET", "/api/projects", token=token)
check("Projects GetAll", "GET", "/api/projects", 200, status, data)

status, data = request("POST", "/api/projects", {"name": "Audit Test Projesi", "code": "PRJ-TEST", "isActive": True}, token=token)
check("Projects Create", "POST", "/api/projects", 201, status, data)
proj_id = data.get("id") if status == 201 else None

if proj_id:
    status, data = request("GET", f"/api/projects/{proj_id}", token=token)
    check("Projects GetById", "GET", f"/api/projects/{proj_id}", 200, status, data)

    status, data = request("PUT", f"/api/projects/{proj_id}", {"name": "Audit Test Projesi (Rev)", "code": "PRJ-REV", "isActive": True}, token=token)
    check("Projects Update", "PUT", f"/api/projects/{proj_id}", 200, status, data)

    status, data = request("DELETE", f"/api/projects/{proj_id}", token=token)
    check("Projects Delete", "DELETE", f"/api/projects/{proj_id}", 204, status, data)

# 5. Companies CRUD
status, data = request("GET", "/api/companies", token=token)
check("Companies GetAll", "GET", "/api/companies", 200, status, data)

status, data = request("POST", "/api/companies", {"name": "Test Deneme A.Ş.", "shortName": "TEST", "firmType": "EXTERNAL", "isActive": True}, token=token)
check("Companies Create", "POST", "/api/companies", 201, status, data)
comp_id = data.get("id") if status == 201 else None

if comp_id:
    status, data = request("GET", f"/api/companies/{comp_id}", token=token)
    check("Companies GetById", "GET", f"/api/companies/{comp_id}", 200, status, data)

    status, data = request("PUT", f"/api/companies/{comp_id}", {"name": "Test Deneme A.Ş. Rev", "shortName": "TEST-R", "firmType": "EXTERNAL", "isActive": True}, token=token)
    check("Companies Update", "PUT", f"/api/companies/{comp_id}", 200, status, data)

    status, data = request("DELETE", f"/api/companies/{comp_id}", token=token)
    check("Companies Delete", "DELETE", f"/api/companies/{comp_id}", 204, status, data)

# 6. Locations CRUD
status, data = request("GET", "/api/locations", token=token)
check("Locations GetAll", "GET", "/api/locations", 200, status, data)

status, data = request("POST", "/api/locations", {"name": "Toplantı Odası Test", "isActive": True}, token=token)
check("Locations Create", "POST", "/api/locations", 201, status, data)
loc_id = data.get("id") if status == 201 else None

if loc_id:
    status, data = request("GET", f"/api/locations/{loc_id}", token=token)
    check("Locations GetById", "GET", f"/api/locations/{loc_id}", 200, status, data)

    status, data = request("PUT", f"/api/locations/{loc_id}", {"name": "Toplantı Odası Test Rev", "isActive": True}, token=token)
    check("Locations Update", "PUT", f"/api/locations/{loc_id}", 200, status, data)

    status, data = request("DELETE", f"/api/locations/{loc_id}", token=token)
    check("Locations Delete", "DELETE", f"/api/locations/{loc_id}", 204, status, data)

# 7. Categories CRUD
status, data = request("GET", "/api/categories", token=token)
check("Categories GetAll", "GET", "/api/categories", 200, status, data)

status, data = request("POST", "/api/categories", {"name": "Kategori Test", "isActive": True}, token=token)
check("Categories Create", "POST", "/api/categories", 201, status, data)
cat_id = data.get("id") if status == 201 else None

if cat_id:
    status, data = request("GET", f"/api/categories/{cat_id}", token=token)
    check("Categories GetById", "GET", f"/api/categories/{cat_id}", 200, status, data)

    status, data = request("PUT", f"/api/categories/{cat_id}", {"name": "Kategori Test Rev", "isActive": True}, token=token)
    check("Categories Update", "PUT", f"/api/categories/{cat_id}", 200, status, data)

    status, data = request("DELETE", f"/api/categories/{cat_id}", token=token)
    check("Categories Delete", "DELETE", f"/api/categories/{cat_id}", 204, status, data)

# 8. Titles CRUD
status, data = request("GET", "/api/titles", token=token)
check("Titles GetAll", "GET", "/api/titles", 200, status, data)

status, data = request("POST", "/api/titles", {"name": "Kıdemli Danışman Test"}, token=token)
check("Titles Create", "POST", "/api/titles", 201, status, data)
title_id = data.get("id") if status == 201 else None

if title_id:
    status, data = request("PUT", f"/api/titles/{title_id}", {"name": "Kıdemli Danışman Test Rev", "isActive": True}, token=token)
    check("Titles Update", "PUT", f"/api/titles/{title_id}", 200, status, data)

    status, data = request("DELETE", f"/api/titles/{title_id}", token=token)
    check("Titles Delete", "DELETE", f"/api/titles/{title_id}", 204, status, data)

# 9. Persons CRUD
status, data = request("GET", "/api/persons", token=token)
check("Persons GetAll", "GET", "/api/persons", 200, status, data)

status, data = request("POST", "/api/persons", {
    "fullName": "Test Personel",
    "companyId": None,
    "title": "Yazılım Uzmanı",
    "email": "test.personel@example.com",
    "phone": "05551112233",
    "linkedUserId": None,
    "isActive": True
}, token=token)
check("Persons Create", "POST", "/api/persons", 201, status, data)
person_id = data.get("id") if status == 201 else None

if person_id:
    status, data = request("GET", f"/api/persons/{person_id}", token=token)
    check("Persons GetById", "GET", f"/api/persons/{person_id}", 200, status, data)

    status, data = request("PUT", f"/api/persons/{person_id}", {
        "fullName": "Test Personel Rev",
        "companyId": None,
        "title": "Kıdemli Yazılım Uzmanı",
        "email": "test.personel.rev@example.com",
        "phone": "05551112244",
        "linkedUserId": None,
        "isActive": True
    }, token=token)
    check("Persons Update", "PUT", f"/api/persons/{person_id}", 200, status, data)

    status, data = request("DELETE", f"/api/persons/{person_id}", token=token)
    check("Persons Delete", "DELETE", f"/api/persons/{person_id}", 204, status, data)

# 10. Users Management
status, data = request("GET", "/api/users", token=token)
check("Users GetAll", "GET", "/api/users", 200, status, data)

test_email = f"test.suite.{int(time.time())}@wamturkey.com"
status, data = request("POST", "/api/users", {
    "email": test_email,
    "fullName": "Test Suite User",
    "password": "Password123!",
    "role": "User",
    "isActive": True,
    "linkedPersonId": None
}, token=token)
check("Users Create", "POST", "/api/users", 201, status, data)
new_user_id = data.get("id") if status == 201 else None

if new_user_id:
    status, data = request("GET", f"/api/users/{new_user_id}", token=token)
    check("Users GetById", "GET", f"/api/users/{new_user_id}", 200, status, data)

    status, data = request("PUT", f"/api/users/{new_user_id}", {
        "email": test_email,
        "fullName": "Test Suite User Updated",
        "role": "User",
        "isActive": True,
        "linkedPersonId": None
    }, token=token)
    check("Users Update", "PUT", f"/api/users/{new_user_id}", 200, status, data)

    status, data = request("DELETE", f"/api/users/{new_user_id}", token=token)
    check("Users Delete", "DELETE", f"/api/users/{new_user_id}", 204, status, data)

# 11. Meetings Flow (Create, Detail, Note, Attendance, Export)
status, data = request("GET", "/api/meetings", token=token)
check("Meetings GetAll", "GET", "/api/meetings", 200, status, data)

status, data = request("POST", "/api/meetings", {
    "title": "API Test Toplantısı",
    "meetingDate": "2026-10-20",
    "plannedStart": "10:00",
    "subject": "Otomasyon Testi",
    "description": "API uçtan uca doğrulama toplantısı"
}, token=token)
check("Meetings Create", "POST", "/api/meetings", 201, status, data)
m_id = data.get("id") if status == 201 else None

if m_id:
    status, data = request("GET", f"/api/meetings/{m_id}", token=token)
    check("Meetings GetById", "GET", f"/api/meetings/{m_id}", 200, status, data)

    status, data = request("PUT", f"/api/meetings/{m_id}", {
        "title": "API Test Toplantısı (Güncel)",
        "meetingDate": "2026-10-20",
        "plannedStart": "10:30",
        "status": "ACTIVE",
        "subject": "Otomasyon Testi Güncelleme",
        "description": "Detay güncellendi"
    }, token=token)
    check("Meetings Update", "PUT", f"/api/meetings/{m_id}", 200, status, data)

    # Add participant
    status, data = request("POST", f"/api/meetings/{m_id}/participants", {
        "personId": 1, # Bora Varol
        "role": "ATTENDEE"
    }, token=token)
    check("Meetings AddParticipant", "POST", f"/api/meetings/{m_id}/participants", 201, status, data)
    part_id = data.get("id") if status == 201 else None

    if part_id:
        status, data = request("PATCH", f"/api/meetings/{m_id}/participants/{part_id}/attendance", False, token=token)
        check("Meetings ToggleAttendance", "PATCH", f"/api/meetings/{m_id}/participants/{part_id}/attendance", 204, status, data)

    # Add Note (TASK type with DueDate -> triggers Followup sync)
    status, data = request("POST", f"/api/meetings/{m_id}/notes", {
        "content": "Test Görev Notu - Rapor Hazırlığı",
        "noteType": "TASK",
        "displayOrder": 1,
        "responsiblePersonId": 1,
        "dueDate": "2026-10-25",
        "actionStatus": "OPEN"
    }, token=token)
    check("Meetings AddNote", "POST", f"/api/meetings/{m_id}/notes", 201, status, data)
    note_id = data.get("id") if status == 201 else None

    if note_id:
        status, data = request("PUT", f"/api/meetings/{m_id}/notes/{note_id}", {
            "content": "Test Görev Notu - Rapor Hazırlığı (Rev)",
            "noteType": "TASK",
            "displayOrder": 1,
            "responsiblePersonId": 1,
            "dueDate": "2026-10-26",
            "actionStatus": "IN_PROGRESS"
        }, token=token)
        check("Meetings UpdateNote", "PUT", f"/api/meetings/{m_id}/notes/{note_id}", 200, status, data)

    # Test PDF Export
    status, data = request("GET", f"/api/meetings/{m_id}/export/pdf", token=token)
    check("Meetings Export PDF", "GET", f"/api/meetings/{m_id}/export/pdf", 200, status, "PDF stream")

    # Test Excel Export
    status, data = request("GET", f"/api/meetings/{m_id}/export/excel", token=token)
    check("Meetings Export Excel", "GET", f"/api/meetings/{m_id}/export/excel", 200, status, "Excel stream")

    # Cleanup Note
    if note_id:
        status, data = request("DELETE", f"/api/meetings/{m_id}/notes/{note_id}", token=token)
        check("Meetings DeleteNote", "DELETE", f"/api/meetings/{m_id}/notes/{note_id}", 204, status, data)

    # Cleanup Meeting
    status, data = request("DELETE", f"/api/meetings/{m_id}", token=token)
    check("Meetings Delete", "DELETE", f"/api/meetings/{m_id}", 204, status, data)

# 12. Followups CRUD
status, data = request("GET", "/api/followups", token=token)
check("Followups GetAll", "GET", "/api/followups", 200, status, data)

status, data = request("POST", "/api/followups", {
    "text": "Doğrudan Takip Maddesi Testi",
    "responsiblePersonId": 1,
    "dueDate": "2026-10-30",
    "actionStatus": "OPEN"
}, token=token)
check("Followups Create", "POST", "/api/followups", 201, status, data)
followup_id = data.get("id") if status == 201 else None

if followup_id:
    status, data = request("GET", f"/api/followups/{followup_id}", token=token)
    check("Followups GetById", "GET", f"/api/followups/{followup_id}", 200, status, data)

    status, data = request("PUT", f"/api/followups/{followup_id}", {
        "text": "Doğrudan Takip Maddesi Testi (Güncel)",
        "responsiblePersonId": 1,
        "dueDate": "2026-10-31",
        "actionStatus": "COMPLETED"
    }, token=token)
    check("Followups Update", "PUT", f"/api/followups/{followup_id}", 200, status, data)

    status, data = request("GET", f"/api/followups/{followup_id}/changelog", token=token)
    check("Followups GetChangelog", "GET", f"/api/followups/{followup_id}/changelog", 200, status, data)

    status, data = request("DELETE", f"/api/followups/{followup_id}", token=token)
    check("Followups Delete", "DELETE", f"/api/followups/{followup_id}", 204, status, data)

# Summary
print("\n" + "="*70)
passed = sum(1 for r in results if r[4])
failed = sum(1 for r in results if not r[4])
print(f"TEST SONUCU: TOPLAM: {len(results)}, BAŞARILI: {passed}, BAŞARISIZ: {failed}")
print("="*70)
if failed > 0:
    sys.exit(1)
