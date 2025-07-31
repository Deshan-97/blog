#!/bin/bash

# AdSense API Testing Script
echo "=== AdSense API Testing ==="
echo ""

BASE_URL="http://localhost:3000"

echo "1. Testing GET /api/adsense-settings"
echo "-----------------------------------"
curl -s "$BASE_URL/api/adsense-settings" | jq '.'
echo ""

echo "2. Testing POST /api/adsense-settings (partial update)"
echo "----------------------------------------------------"
curl -s -X POST "$BASE_URL/api/adsense-settings" \
  -H "Content-Type: application/json" \
  -d '{
    "adsense_client_id": "ca-pub-1234567890123456",
    "adsense_enabled": "true"
  }' | jq '.'
echo ""

echo "3. Verifying partial update"
echo "---------------------------"
curl -s "$BASE_URL/api/adsense-settings" | jq '.'
echo ""

echo "4. Testing POST /api/adsense-settings (add slot IDs)"
echo "--------------------------------------------------"
curl -s -X POST "$BASE_URL/api/adsense-settings" \
  -H "Content-Type: application/json" \
  -d '{
    "adsense_ad_slot_header": "1234567890",
    "adsense_ad_slot_sidebar": "0987654321",
    "adsense_display_ads": "true"
  }' | jq '.'
echo ""

echo "5. Testing PUT /api/adsense-settings (complete update)"
echo "----------------------------------------------------"
curl -s -X PUT "$BASE_URL/api/adsense-settings" \
  -H "Content-Type: application/json" \
  -d '{
    "adsense_client_id": "ca-pub-9876543210987654",
    "adsense_enabled": "true",
    "adsense_auto_ads": "true",
    "adsense_display_ads": "true",
    "adsense_ad_slot_header": "1111111111",
    "adsense_ad_slot_sidebar": "2222222222",
    "adsense_ad_slot_footer": "3333333333"
  }' | jq '.'
echo ""

echo "6. Verifying complete update"
echo "----------------------------"
curl -s "$BASE_URL/api/adsense-settings" | jq '.'
echo ""

echo "7. Testing GET /api/adsense-code/header"
echo "--------------------------------------"
curl -s "$BASE_URL/api/adsense-code/header" | jq '.'
echo ""

echo "8. Testing GET /api/adsense-code/sidebar"
echo "---------------------------------------"
curl -s "$BASE_URL/api/adsense-code/sidebar" | jq '.'
echo ""

echo "9. Testing GET /api/adsense-code/footer"
echo "--------------------------------------"
curl -s "$BASE_URL/api/adsense-code/footer" | jq '.'
echo ""

echo "10. Testing invalid position"
echo "----------------------------"
curl -s "$BASE_URL/api/adsense-code/invalid" | jq '.'
echo ""

echo "11. Testing disabled AdSense"
echo "----------------------------"
curl -s -X POST "$BASE_URL/api/adsense-settings" \
  -H "Content-Type: application/json" \
  -d '{"adsense_enabled": "false"}' | jq '.'
echo ""

curl -s "$BASE_URL/api/adsense-code/header" | jq '.'
echo ""

echo "12. Testing empty request body"
echo "------------------------------"
curl -s -X POST "$BASE_URL/api/adsense-settings" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

echo "=== AdSense API Testing Complete ==="
