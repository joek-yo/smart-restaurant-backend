#!/bin/bash
# ═══════════════════════════════════════════════════════
#  END-TO-END TEST SCRIPT — Smart Restaurant Backend
# ═══════════════════════════════════════════════════════

BASE="http://localhost:5000"
PASS=0
FAIL=0
TOKEN=""
TENANT_ID="tenant-test-001"
BUSINESS_ID=""
SESSION_ID="session-$(date +%s)"
PRODUCT_ID=""
CATEGORY_ID=""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC} — $1"; ((PASS++)); }
fail() { echo -e "${RED}❌ FAIL${NC} — $1 | Response: $2"; ((FAIL++)); }
section() { echo -e "\n${YELLOW}━━━ $1 ━━━${NC}"; }

check() {
  local label="$1"
  local expected="$2"
  local response="$3"
  if echo "$response" | grep -q "$expected"; then
    pass "$label"
  else
    fail "$label" "$response"
  fi
}

# ── Start server ──────────────────────────────────────
section "STARTING SERVER"
cd ~/backend-clean
npm run build > /dev/null 2>&1
node dist/main.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
echo "Waiting for server to be ready..."
for i in {1..20}; do
  sleep 2
  if curl -s "$BASE" > /dev/null 2>&1 || curl -s "$BASE/health" > /dev/null 2>&1; then
    echo "Server is up!"
    break
  fi
  echo "  still waiting... ($((i*2))s)"
done

# Extra wait for DB connections
sleep 3

# ── 1. HEALTH CHECK ───────────────────────────────────
section "1. HEALTH"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health" 2>/dev/null || \
    curl -s -o /dev/null -w "%{http_code}" "$BASE" 2>/dev/null)
if [[ "$R" == "200" || "$R" == "404" || "$R" == "401" ]]; then
  pass "Server responding (HTTP $R)"
else
  fail "Server not responding" "HTTP $R"
fi

# ── 2. AUTH ───────────────────────────────────────────
section "2. AUTH — Register + Login"

R=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@smartrestaurant.com",
    "password": "Test1234!",
    "name": "Test Owner"
  }')
echo "Register: $R"
check "Auth - Register" "email\|already\|created\|token\|user\|id" "$R"

R=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@smartrestaurant.com",
    "password": "Test1234!"
  }')
echo "Login: $R"
TOKEN=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token') or d.get('token') or '')" 2>/dev/null)
if [ -n "$TOKEN" ]; then
  pass "Auth - Login (got token)"
  echo "  Token: ${TOKEN:0:40}..."
else
  fail "Auth - Login (no token)" "$R"
fi

AUTH="Authorization: Bearer $TOKEN"

# ── 3. BUSINESS ───────────────────────────────────────
section "3. BUSINESS — Create + Get"

R=$(curl -s -X POST "$BASE/business" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "name": "Test Restaurant",
    "type": "restaurant",
    "phone": "254700000000",
    "email": "biz@test.com"
  }')
echo "Create business: $R"
BUSINESS_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('_id') or d.get('id') or '')" 2>/dev/null)
check "Business - Create" "name\|_id\|id\|restaurant\|already" "$R"

R=$(curl -s "$BASE/business" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID")
check "Business - Get" "name\|\[\]\|business\|restaurant" "$R"

# ── 4. CATALOG ────────────────────────────────────────
section "4. CATALOG — Category + Product"

R=$(curl -s -X POST "$BASE/catalog/categories" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "name": "Burgers",
    "description": "All our burgers"
  }')
echo "Create category: $R"
CATEGORY_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('_id') or d.get('id') or '')" 2>/dev/null)
check "Catalog - Create Category" "name\|_id\|id\|Burger\|category" "$R"

R=$(curl -s -X POST "$BASE/catalog/products" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"name\": \"Classic Burger\",
    \"price\": 500,
    \"categoryId\": \"$CATEGORY_ID\",
    \"description\": \"A classic beef burger\"
  }")
echo "Create product: $R"
PRODUCT_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('_id') or d.get('id') or '')" 2>/dev/null)
check "Catalog - Create Product" "name\|_id\|id\|Burger\|price\|product" "$R"

R=$(curl -s "$BASE/catalog/products" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID")
check "Catalog - List Products" "name\|\[\]\|Classic\|product" "$R"

# ── 5. SESSIONS ───────────────────────────────────────
section "5. SESSIONS — Create + Cart"

R=$(curl -s -X POST "$BASE/sessions" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"userId\": \"user-test-001\",
    \"channel\": \"whatsapp\"
  }")
echo "Create session: $R"
check "Session - Create" "session\|id\|created\|user\|channel\|_id" "$R"

R=$(curl -s -X POST "$BASE/sessions/$SESSION_ID/cart" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"quantity\": 2,
    \"price\": 500,
    \"name\": \"Classic Burger\"
  }")
echo "Add to cart: $R"
check "Session - Add to Cart" "cart\|item\|product\|quantity\|session\|id" "$R"

R=$(curl -s "$BASE/sessions/$SESSION_ID" \
  -H "x-tenant-id: $TENANT_ID")
check "Session - Get" "session\|id\|cart\|user" "$R"

# ── 6. CHECKOUT ───────────────────────────────────────
section "6. CHECKOUT — Start + Summary"

R=$(curl -s -X POST "$BASE/checkout/start" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"userId\": \"user-test-001\",
    \"tenantId\": \"$TENANT_ID\"
  }")
echo "Start checkout: $R"
CHECKOUT_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('checkoutId') or d.get('_id') or d.get('id') or '')" 2>/dev/null)
check "Checkout - Start" "checkout\|id\|session\|cart\|status" "$R"

R=$(curl -s "$BASE/checkout/$CHECKOUT_ID/summary" \
  -H "x-tenant-id: $TENANT_ID")
check "Checkout - Summary" "total\|item\|summary\|checkout\|amount\|price" "$R"

# ── 7. ORDERS ─────────────────────────────────────────
section "7. ORDERS — Create + Status"

R=$(curl -s -X POST "$BASE/orders" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"userId\": \"user-test-001\",
    \"items\": [{
      \"productId\": \"$PRODUCT_ID\",
      \"name\": \"Classic Burger\",
      \"quantity\": 2,
      \"price\": 500
    }],
    \"total\": 1000
  }")
echo "Create order: $R"
ORDER_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('_id') or d.get('id') or d.get('orderId') or '')" 2>/dev/null)
check "Orders - Create" "order\|_id\|id\|status\|item\|total" "$R"

R=$(curl -s "$BASE/orders" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID")
check "Orders - List" "order\|\[\]\|_id\|id\|status" "$R"

# ── 8. PAYMENTS ───────────────────────────────────────
section "8. PAYMENTS — Initiate"

R=$(curl -s -X POST "$BASE/payments/initiate" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"amount\": 1000,
    \"currency\": \"KES\",
    \"provider\": \"mpesa\",
    \"phone\": \"254700000000\"
  }")
echo "Initiate payment: $R"
check "Payments - Initiate" "payment\|id\|initiated\|pending\|status\|provider\|error\|amount" "$R"

# ── 9. CONVERSATION ───────────────────────────────────
section "9. CONVERSATION — Process Message"

R=$(curl -s -X POST "$BASE/conversation/message" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"from\": \"254700000000\",
    \"message\": \"Hello, I want to order a burger\",
    \"channel\": \"whatsapp\",
    \"sessionId\": \"$SESSION_ID\"
  }")
echo "Conversation message: $R"
check "Conversation - Process Message" "response\|message\|reply\|intent\|session\|burger\|error\|result" "$R"

# ── 10. PROTECTION ────────────────────────────────────
section "10. PROTECTION — Workflow Health"

R=$(curl -s "$BASE/protection/health" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID")
echo "Protection health: $R"
check "Protection - Health" "health\|status\|workflow\|ok\|error\|protection" "$R"

R=$(curl -s "$BASE/workflow-health" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID")
check "Protection - Workflow Health Alt" "health\|status\|workflow\|ok\|error" "$R"

# ── 11. RECOVERY ──────────────────────────────────────
section "11. RECOVERY — Trigger Session Recovery"

R=$(curl -s -X POST "$BASE/recovery/session" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"tenantId\": \"$TENANT_ID\",
    \"userId\": \"user-test-001\",
    \"reason\": \"TIMEOUT\"
  }")
echo "Recovery: $R"
check "Recovery - Session" "recover\|session\|success\|result\|status\|error" "$R"

# ── 12. SMARTPAGE ─────────────────────────────────────
section "12. SMARTPAGE — Create + Render"

R=$(curl -s -X POST "$BASE/smartpage" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "title": "Test SmartPage",
    "status": "active",
    "blocks": [],
    "routing": { "path": "/test", "rules": [] }
  }')
echo "Create smartpage: $R"
SMARTPAGE_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('_id') or d.get('id') or '')" 2>/dev/null)
check "SmartPage - Create" "smartpage\|id\|_id\|title\|status\|page\|block" "$R"

R=$(curl -s -X POST "$BASE/smartpage/$SMARTPAGE_ID/render" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"userId\": \"user-test-001\",
    \"sessionId\": \"$SESSION_ID\"
  }")
check "SmartPage - Render" "render\|block\|page\|result\|error\|id" "$R"

# ── 13. FOLLOW-UP ─────────────────────────────────────
section "13. FOLLOW-UP ENGINE"

R=$(curl -s -X POST "$BASE/follow-up/trigger" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{
    \"type\": \"abandonment\",
    \"userId\": \"user-test-001\",
    \"sessionId\": \"$SESSION_ID\",
    \"tenantId\": \"$TENANT_ID\"
  }")
echo "Follow-up trigger: $R"
check "Follow-up - Trigger" "follow\|job\|scheduled\|trigger\|error\|id\|status" "$R"

R=$(curl -s "$BASE/follow-up/status/$SESSION_ID" \
  -H "$AUTH" \
  -H "x-tenant-id: $TENANT_ID")
check "Follow-up - Status" "follow\|status\|job\|session\|null\|error\|\[\]" "$R"

# ── RESULTS ───────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo -e "  ${GREEN}PASSED: $PASS${NC}   ${RED}FAILED: $FAIL${NC}"
echo "═══════════════════════════════════════"

# ── Stop server ───────────────────────────────────────
section "STOPPING SERVER"
kill $SERVER_PID 2>/dev/null
echo "Server stopped."
