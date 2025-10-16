# GitHub Actions 自動化セットアップガイド

## 📋 概要

毎日 UTC 2:00（日本時間 11:00）に全銘柄のバッチ処理を自動実行します。

## 🚀 セットアップ手順

### ステップ1: GitHubリポジトリの作成

#### 方法A: GitHub CLIを使用（推奨）

```bash
# GitHubにログイン（初回のみ）
gh auth login

# プライベートリポジトリを作成
gh repo create filter --private --source=. --remote=origin --push

# または、パブリックリポジトリの場合
gh repo create filter --public --source=. --remote=origin --push
```

#### 方法B: 手動でGitHubにリポジトリを作成

1. https://github.com/new にアクセス
2. リポジトリ名: `filter`
3. Private/Public を選択
4. "Create repository" をクリック
5. ローカルでリモートを追加:

```bash
git remote add origin https://github.com/YOUR_USERNAME/filter.git
git branch -M main
git add .
git commit -m "feat: 全銘柄バッチ処理システムの初期実装"
git push -u origin main
```

### ステップ2: GitHub Secretsの設定

GitHubリポジトリで以下の手順を実施:

1. リポジトリページで `Settings` タブをクリック
2. 左メニューから `Secrets and variables` → `Actions` をクリック
3. `New repository secret` ボタンをクリック

#### 必要なシークレット

##### 2-1. CRON_SECRET の作成

安全なランダム文字列を生成:

```bash
# macOSの場合
openssl rand -base64 32

# 出力例: eWvhVEiN1PytTKp5bcTEieaNngckVXfhbFyGeBWWEQY=
```

GitHub Secretsに追加:
- **Name**: `CRON_SECRET`
- **Secret**: 上記で生成した文字列

##### 2-2. VERCEL_URL の設定

**注意**: この時点ではまだVercelにデプロイしていないため、一旦仮の値を設定します。

- **Name**: `VERCEL_URL`
- **Secret**: `your-app-name.vercel.app`（後でVercelデプロイ後に更新）

### ステップ3: .env.local への CRON_SECRET 追加

ローカル環境でも同じCRON_SECRETを使用します:

```bash
# .env.local に追加
echo "CRON_SECRET=eWvhVEiN1PytTKp5bcTEieaNngckVXfhbFyGeBWWEQY=" >> .env.local
```

**重要**: `.env.local` は `.gitignore` に含まれているため、Gitにコミットされません。

### ステップ4: ワークフローファイルのプッシュ

```bash
git add .github/workflows/daily-batch.yml
git commit -m "feat: GitHub Actions 毎日バッチ処理ワークフローを追加"
git push origin main
```

### ステップ5: ワークフローの確認

1. GitHubリポジトリで `Actions` タブをクリック
2. "Daily Stock Data Batch Processing" ワークフローが表示されていることを確認
3. 手動実行で動作テスト:
   - ワークフロー名をクリック
   - `Run workflow` ボタンをクリック
   - `Run workflow` を再度クリック

**注意**: Vercelデプロイが完了するまでは、ワークフローは失敗します。これは正常です。

## 📊 実行スケジュール

```yaml
schedule:
  - cron: '0 2 * * *'  # 毎日 UTC 2:00 = JST 11:00
```

## 🔍 ログの確認方法

1. GitHubリポジトリの `Actions` タブ
2. 該当のワークフロー実行をクリック
3. `batch-process` ジョブをクリック
4. 各ステップの詳細ログを確認

## 📧 エラー通知

- ワークフローが失敗した場合、GitHubから登録メールアドレスに通知が届きます
- GitHub設定で通知方法をカスタマイズ可能

## 🔧 トラブルシューティング

### エラー: "Resource not accessible by integration"

**原因**: GitHub Actionsの権限設定

**解決方法**:
1. リポジトリの `Settings` → `Actions` → `General`
2. "Workflow permissions" セクション
3. "Read and write permissions" を選択
4. `Save` をクリック

### エラー: "curl: (6) Could not resolve host"

**原因**: `VERCEL_URL` が正しく設定されていない

**解決方法**:
1. Vercelにデプロイ（次のステップ）
2. 正しいVercel URLでSecretを更新

### エラー: "Unauthorized"

**原因**: `CRON_SECRET` が一致していない

**解決方法**:
1. GitHub Secretsの `CRON_SECRET` を確認
2. Vercel環境変数の `CRON_SECRET` を確認
3. 両方が完全に一致することを確認

## ✅ 完了確認

以下を確認してください:

- [ ] GitHubリポジトリが作成されている
- [ ] `.github/workflows/daily-batch.yml` がプッシュされている
- [ ] GitHub Secretsに `CRON_SECRET` が設定されている
- [ ] GitHub Secretsに `VERCEL_URL` が設定されている（仮の値でOK）
- [ ] `.env.local` に `CRON_SECRET` が追加されている
- [ ] Actions タブでワークフローが表示されている

## 🎯 次のステップ

GitHub Actionsの設定が完了したら:

1. **BRK.B銘柄の除外**（1分）
2. **Vercel本番デプロイ**（10分）
3. **GitHub SecretsのVERCEL_URLを更新**
4. **ワークフローの手動実行でテスト**

すべて完了すれば、毎日自動でバッチ処理が実行されます！🎉

## 📝 参考情報

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
