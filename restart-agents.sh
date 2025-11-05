#!/bin/bash
# Script to restart all agents via API

API_BASE="https://somnia-git-agent.onrender.com"

echo "🔄 Restarting all agents..."
echo "Calling ${API_BASE}/api/agents/restart-all..."
echo ""

response=$(curl -X POST "${API_BASE}/api/agents/restart-all" \
  -H "Content-Type: application/json" \
  --max-time 60 \
  -s -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

if [ "$http_status" -eq 200 ]; then
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  echo ""
  echo "✅ Restart request successful. Agents should restart within a few seconds."
else
  echo "❌ Error: HTTP $http_status"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  exit 1
fi
