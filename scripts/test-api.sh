#!/bin/bash
# API エンドポイントテストスクリプト

echo "🧪 API エンドポイントテスト開始"
echo "================================"

# 環境変数チェック
if [ -z "$CRON_SECRET" ]; then
  echo "⚠️ CRON_SECRET が設定されていません"
  echo "実行方法: CRON_SECRET=your-secret ./scripts/test-api.sh"
  exit 1
fi

# APIエンドポイント
API_URL="${1:-http://localhost:3001}"
ENDPOINT="$API_URL/api/process-stock"

echo ""
echo "📍 テスト対象:"
echo "   URL: $ENDPOINT"
echo "   認証: Bearer $CRON_SECRET"
echo ""

# テスト銘柄
SYMBOLS=("AAPL" "MSFT" "GOOGL")

for SYMBOL in "${SYMBOLS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 テスト: $SYMBOL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"symbol\":\"$SYMBOL\"}")

  # HTTPステータスコードを取得
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ 成功 (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.'
  else
    echo "❌ 失敗 (HTTP $HTTP_CODE)"
    echo "$BODY"
  fi

  echo ""

  # レート制限対策: 3秒待機
  if [ "$SYMBOL" != "${SYMBOLS[-1]}" ]; then
    echo "⏳ 3秒待機..."
    sleep 3
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ テスト完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
