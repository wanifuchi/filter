# 全銘柄データ自動更新システム - セットアップガイド

**6,000+銘柄の株価データを毎日自動更新するシステムです**

## 📋 システム概要

### アーキテクチャ
```
GitHub Actions (毎日2:00 UTC)
  ↓ 6,052銘柄をループ処理
  ↓ 18秒間隔でAPI呼び出し（Yahoo Finance レート制限対策）
Vercel API Endpoint (/api/process-stock)
  ↓ 1銘柄あたり3-5秒で処理（10秒制限内）
  ↓ テクニカル指標計算 + AI予測
Supabase (PostgreSQL)
  ↓ データ保存
フロントエンド (/screener)
  ↓ リアルタイム検索・表示
```

### 実行時間
- **処理時間**: 約30時間（6,052銘柄 × 18秒）
- **コスト**: $0/月（完全無料）
- **更新頻度**: 毎日1回

### 取得データ
- 現在株価・出来高・時価総額
- 移動平均線（10, 20, 50, 200日）
- RSI（14日）
- ADR（20日）
- パーフェクトオーダー判定
- AI予測スコア（0-100点）
- 投資判断（BUY/HOLD/SELL）

---

## 🚀 セットアップ手順

### 1. Supabaseプロジェクト作成

#### 1.1 Supabaseアカウント作成
1. https://supabase.com/ にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ

#### 1.2 新規プロジェクト作成
1. 「New Project」をクリック
2. プロジェクト名: `us-stock-screener`
3. Database Password: 強力なパスワードを設定
4. Region: `East US (North Virginia)` （最も近いリージョン）
5. 「Create new project」をクリック（約2分待機）

#### 1.3 APIキーとURL取得
1. 左サイドバー → 「Settings」 → 「API」
2. 以下をコピー:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJxxx...`
   - **service_role key**: `eyJxxx...` （⚠️ 絶対に公開しないこと）

#### 1.4 データベーステーブル作成
1. 左サイドバー → 「SQL Editor」
2. `prisma/migrations/001_add_batch_jobs.sql` の内容をコピー＆ペースト
3. 「Run」をクリック
4. ✅ テーブル作成完了

---

### 2. Vercelプロジェクト設定

#### 2.1 Vercelデプロイ
```bash
# 初回デプロイ
npx vercel

# 本番デプロイ
npx vercel --prod
```

#### 2.2 環境変数設定
Vercel Dashboard → Settings → Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJxxx... | All |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJxxx... | Production, Preview |
| `CRON_SECRET` | ランダムな文字列（32文字以上） | All |

**CRON_SECRET生成方法:**
```bash
# ランダムな32文字の文字列を生成
openssl rand -base64 32
```

#### 2.3 デプロイURLを確認
```
例: https://filter-xxx.vercel.app
```

---

### 3. GitHubリポジトリ設定

#### 3.1 リポジトリ作成
1. GitHubで新規リポジトリ作成
2. ローカルでGit初期化:
```bash
git init
git add .
git commit -m "feat: 全銘柄自動更新システム実装"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

#### 3.2 GitHub Secrets設定
GitHub リポジトリ → Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Value |
|-------------|-------|
| `VERCEL_API_URL` | https://filter-xxx.vercel.app |
| `CRON_SECRET` | Vercelで設定したものと同じ値 |

---

### 4. GitHub Actions有効化

#### 4.1 Actionsタブで有効化
1. GitHubリポジトリ → Actions タブ
2. 「I understand my workflows, go ahead and enable them」をクリック

#### 4.2 手動テスト実行
1. Actions → 「Update Stock Data (All 6,000+ Stocks)」
2. 「Run workflow」をクリック
3. テストモード: `true` を選択（10銘柄のみ）
4. 「Run workflow」をクリック
5. 実行ログを確認（約3分）

---

## 📊 動作確認

### ローカルテスト（推奨）

#### 銘柄リスト生成テスト
```bash
npx tsx scripts/generate-symbols.ts
```
✅ 期待結果: `public/all-symbols.json` が作成される（6,000+銘柄）

#### API エンドポイントテスト（ローカル）
```bash
# 開発サーバー起動
npm run dev

# 別のターミナルで
curl -X POST http://localhost:3000/api/process-stock \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL"}'
```

✅ 期待結果:
```json
{
  "success": true,
  "symbol": "AAPL",
  "duration": "3241ms",
  "data": {
    "price": 185.25,
    "aiScore": 78,
    "decision": "BUY"
  }
}
```

---

## ⚙️ 運用・管理

### 自動実行スケジュール
```yaml
毎日 2:00 UTC (日本時間 11:00)
約30時間で6,000+銘柄すべてを更新
```

### 手動実行方法
```bash
# GitHub Actions手動実行
1. GitHubリポジトリ → Actions
2. "Update Stock Data" → "Run workflow"
3. オプション:
   - start_index: 開始インデックス（デフォルト: 0）
   - end_index: 終了インデックス（空欄で全銘柄）
   - test_mode: テストモード（10銘柄のみ）
```

### 実行ログ確認
```bash
# GitHub Actions
リポジトリ → Actions → 最新の実行を選択

# ログファイル（失敗時のみ）
Artifacts → update-logs → ダウンロード
```

### エラーハンドリング
システムは以下のエラーを自動処理します：
- **Yahoo Finance APIタイムアウト**: 自動スキップ、次の銘柄へ
- **データ不足**: 200日分のデータがない銘柄はスキップ
- **Supabaseエラー**: エラーログに記録、処理継続
- **10%以上失敗**: GitHub Actions終了コード1（アラート）

---

## 🔧 トラブルシューティング

### 問題1: GitHub Actionsが失敗する
**原因**: Secrets設定ミス

**解決策**:
1. GitHub → Settings → Secrets を確認
2. `VERCEL_API_URL` が正しいVercel URLか確認
3. `CRON_SECRET` がVercelと一致しているか確認

### 問題2: Vercel APIが401エラー
**原因**: CRON_SECRET不一致

**解決策**:
```bash
# Vercel環境変数を確認
npx vercel env ls

# 再設定
npx vercel env add CRON_SECRET
```

### 問題3: Supabaseへの保存が失敗
**原因**: サービスロールキーが未設定

**解決策**:
1. Supabase → Settings → API → service_role key をコピー
2. Vercel → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY` を追加

### 問題4: Yahoo Finance APIがタイムアウト
**原因**: レート制限

**解決策**:
- 自動スキップされるため問題なし
- 次回の自動実行で再試行される

---

## 📈 パフォーマンス最適化

### レート制限対策
```javascript
// 18秒待機（Yahoo Finance: 2,000 calls/hour）
const waitTime = 18000; // ミリ秒
await new Promise(resolve => setTimeout(resolve, waitTime));
```

### 並列処理（将来の改善案）
現在: 順次処理（6,052銘柄 × 18秒 = 30時間）
将来: 複数GitHub Actionsで並列処理（5分の1に短縮可能）

### データベース最適化
- インデックス: symbol, date, ai_score
- UNIQUE制約: (symbol, date) で重複防止
- 自動更新トリガー: updated_at カラム

---

## 💰 コスト分析

### 完全無料で運用可能

| サービス | 無料枠 | 使用量 | コスト |
|---------|--------|--------|--------|
| **Vercel** | 100時間/月 | 約0.5時間/日 × 30日 = 15時間/月 | $0 |
| **Supabase** | 500MB DB, 2GB転送 | 約50MB DB, 100MB転送 | $0 |
| **GitHub Actions** | 2,000分/月 | 約1,800分/月（30時間） | $0 |

**合計: $0/月** ✨

---

## 🎯 次のステップ

### Phase 2: 拡張機能
1. **優先度別更新**: Tier 1-4で更新頻度を変える
2. **並列処理**: 複数GitHub Actionsで高速化
3. **エラーリトライ**: 失敗した銘柄を自動再試行
4. **Slackアラート**: 重要なエラーをSlack通知
5. **ダッシュボード**: 実行状況をリアルタイム表示

### 監視・アラート設定
- GitHub Actionsのメール通知を有効化
- Supabaseダッシュボードで日次チェック
- ログファイルの定期確認

---

## 📚 関連ドキュメント

- [GitHub Actions Cron構文](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Vercel Serverless Functions制限](https://vercel.com/docs/functions/limitations)
- [Yahoo Finance API非公式ドキュメント](https://github.com/ranaroussi/yfinance)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)

---

## ✅ 完成！

セットアップ完了後、以下が自動化されます：

✅ 毎日2:00 UTC（日本時間11:00）に自動実行
✅ 6,052銘柄の株価データを更新
✅ テクニカル指標を自動計算
✅ AI予測スコアを自動生成
✅ Supabaseに自動保存
✅ フロントエンドでリアルタイム検索可能

**完全無料で運用できます！** 🎉
