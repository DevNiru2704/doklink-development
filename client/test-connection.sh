#!/bin/bash
# test-connection.sh
# Quick script to test if Django backend is accessible

echo "🔍 Testing Django Backend Connection..."
echo "=================================="

echo ""
echo "1️⃣ Testing basic server response..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://127.0.0.1:8000/

echo ""
echo "2️⃣ Testing API signup endpoint..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://127.0.0.1:8000/api/auth/signup/

echo ""
echo "3️⃣ Testing Django admin..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://127.0.0.1:8000/admin/

echo ""
echo "📊 Expected Results:"
echo "  - Server: 200 (OK)"
echo "  - API Signup: 405 (Method Not Allowed - normal for GET on POST endpoint)"
echo "  - Admin: 200 (OK)"
echo ""
echo "If you see these statuses, your backend is ready for React Native!"
