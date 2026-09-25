#!/bin/bash
set -e

# 1. Create meeting 2 and 3
M2=$(curl -s -X POST http://localhost:5180/api/Meetings -H "Content-Type: application/json" -d '{"title":"Test 2", "meetingDate":"2026-09-20", "status":"DRAFT"}' | jq '.id')
M3=$(curl -s -X POST http://localhost:5180/api/Meetings -H "Content-Type: application/json" -d '{"title":"Test 3", "meetingDate":"2026-09-21", "status":"DRAFT"}' | jq '.id')

# 2. Add note to meeting 2
N2=$(curl -s -X POST http://localhost:5180/api/Meetings/$M2/notes -H "Content-Type: application/json" -d '{"content":"Test Note", "noteType":"TASK", "dueDate":"2026-09-22"}' | jq '.id')

# 3. Create link M2 -> M3
L_ID=$(curl -s -X POST http://localhost:5180/api/Meetings/$M3/links -H "Content-Type: application/json" -d "{\"childMeetingId\":$M2, \"relationType\":\"CONTINUATION\"}" | jq '.id')

# Wait, childMeetingId=$M2 means M3 is Parent, M2 is Child. We want M2 is Parent, M3 is Child.
# Actually, the payload is "linkedMeetingId", the backend handles Parent/Child based on relation.
# Let's check backend AddLink.
