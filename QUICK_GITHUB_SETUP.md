# 🚀 GitHub Actions クイックセットアップガイド（手動版）

## ステップ1: GitHubリポジトリの作成（2分）

### 1-1. 新しいリポジトリを作成

1. ブラウザで https://github.com/new を開く
2. 以下の情報を入力:
   - **Repository name**: `filter`
   - **Description**: US Stock Screener with AI Analysis
   - **Visibility**: Private（または Public）
   - **Initialize this repository**: チェックを入れない
3. "Create repository" をクリック

### 1-2. ローカルリポジトリとリンク

表示される指示の中から、以下のコマンドをコピーして実行してください:

```bash
# GitHubで表示されているコマンドをコピーして実行
# 例:
git remote add origin https://github.com/YOUR_USERNAME/filter.git
git branch -M main
git add .
git commit -m "feat: 全銘柄バッチ処理システムの初期実装"
git push -u origin main
```

## ステップ2: GitHub Secretsの設定（3分）

### 2-1. Secretsページに移動

1. GitHubのリポジトリページで **Settings** タブをクリック
2. 左メニューから **Secrets and variables** → **Actions** をクリック
3. 右上の **New repository secret** ボタンをクリック

### 2-2. CRON_SECRETの追加

**1つ目のSecret:**
- **Name**: `CRON_SECRET`
- **Secret**:
```
Ji5jg7bocLPw7J1ketCYf+xbaOh1rurXu3GHGycoTnc=
```
- "Add secret" をクリック

### 2-3. VERCEL_URLの追加（仮）

**2つ目のSecret:**
- **Name**: `VERCEL_URL`
- **Secret**:
```
your-app-name.vercel.app
```
- "Add secret" をクリック

**注**: この値は後でVercelデプロイ後に実際のURLに更新します。

## ステップ3: GitHub Actionsの確認（1分）

1. リポジトリページで **Actions** タブをクリック
2. 「Daily Stock Data Batch Processing」ワークフローが表示されることを確認
3. ワークフロー名をクリック
4. 右上の **Run workflow** ボタンをクリック
5. **Run workflow** を再度クリック

**注**: この時点ではVercelにデプロイしていないため、ワークフローは失敗します（これは正常です）。

## ✅ セットアップ完了チェックリスト

確認してください:

- [ ] GitHubリポジトリが作成されている
- [ ] ローカルのコードがGitHubにプッシュされている
- [ ] GitHub Secretsに `CRON_SECRET` が設定されている
- [ ] GitHub Secretsに `VERCEL_URL` が設定されている（仮の値でOK）
- [ ] Actions タブで「Daily Stock Data Batch Processing」が表示されている

## 🎯 次のステップ

GitHub Actionsのセットアップが完了したら:

### ステップ2: BRK.B銘柄の除外（1分）

Supabaseで以下のSQLを実行:

```sql
UPDATE stocks
SET is_active = false
WHERE symbol = 'BRK.B';
```

### ステップ3: Vercel本番デプロイ（10分）

以下のコマンドを実行:

```bash
# Vercelにログイン（初回のみ）
vercel login

# 本番デプロイ
vercel --prod
```

### ステップ4: VERCEL_URLの更新

Vercelデプロイ後、表示されるURLをコピーして:

1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions**
2. `VERCEL_URL` をクリック
3. "Update secret" で実際のVercel URLに更新（例: `filter-abc123.vercel.app`）

### ステップ5: 動作確認

1. GitHubの **Actions** タブ
2. 「Daily Stock Data Batch Processing」をクリック
3. **Run workflow** で手動実行
4. ログを確認して、バッチ処理が成功することを確認

## 📝 重要情報

### CRON_SECRET
```
Ji5jg7bocLPw7J1ketCYf+xbaOh1rurXu3GHGycoTnc=
```

このシークレットは以下に設定されています:
- ✅ GitHub Secrets: `CRON_SECRET`
- ✅ .env.local: `CRON_SECRET`
- ⏳ Vercel環境変数: `CRON_SECRET`（次のステップで設定）

### 自動実行スケジュール

毎日 **UTC 2:00**（日本時間 **11:00**）に自動実行されます。

## 💡 トラブルシューティング

### Q: ワークフローが「workflow not found」エラーになる

A: `.github/workflows/daily-batch.yml` がGitHubにプッシュされているか確認してください。

### Q: Secretsが見つからない

A: Settings → Secrets and variables → **Actions**（Codepaのタブではない）を確認してください。

### Q: ワークフローが失敗する

A: 現時点ではVercelにデプロイしていないため、正常です。Vercelデプロイ後に成功します。

## 📞 サポート

詳細なセットアップガイドは `GITHUB_ACTIONS_SETUP.md` を参照してください。
