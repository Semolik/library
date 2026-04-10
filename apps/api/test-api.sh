#!/bin/bash

# API Testing Examples

BASE_URL="http://localhost:3001"

echo "========================================"
echo "Testing NestJS API"
echo "========================================"

# Check if API is running
echo -e "\n[1] Checking API health..."
curl -X GET $BASE_URL/api/health
echo -e "\n✓ API is running on $BASE_URL\n"

# Test Registration
echo "========================================"
echo "[2] Testing User Registration"
echo "========================================"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "password123"
  }')

echo "Response:"
echo $REGISTER_RESPONSE | jq .

# Extract access token
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.refreshToken')

echo -e "\nAccess Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"

# Test Login
echo -e "\n========================================"
echo "[3] Testing User Login"
echo "========================================"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }')

echo "Response:"
echo $LOGIN_RESPONSE | jq .

# Test Profile (Protected Route)
echo -e "\n========================================"
echo "[4] Testing Get Profile (Protected)"
echo "========================================"
curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Test Refresh Token
echo -e "\n========================================"
echo "[5] Testing Refresh Token"
echo "========================================"
REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "Response:"
echo $REFRESH_RESPONSE | jq .

echo -e "\n========================================"
echo "✓ All tests completed!"
echo "========================================"

