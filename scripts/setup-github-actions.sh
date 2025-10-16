#!/bin/bash

# GitHub Actions セットアップスクリプト
# このスクリプトはGitHub Actionsの初期設定を支援します

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 GitHub Actions セットアップ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# CRON_SECRETの生成
CRON_SECRET="Ji5jg7bocLPw7J1ketCYf+xbaOh1rurXu3GHGycoTnc="

echo "✅ ステップ1: CRON_SECRETの生成完了"
echo ""
echo "  CRON_SECRET: $CRON_SECRET"
echo ""
echo "  ⚠️  このシークレットは以下の場所に設定してください:"
echo "     1. GitHub Secrets (CRON_SECRET)"
echo "     2. Vercel環境変数 (CRON_SECRET)"
echo "     3. .env.local (CRON_SECRET)"
echo ""

# .env.localにCRON_SECRETを追加
if ! grep -q "CRON_SECRET" .env.local 2>/dev/null; then
  echo "CRON_SECRET=$CRON_SECRET" >> .env.local
  echo "✅ ステップ2: .env.local にCRON_SECRETを追加しました"
else
  echo "ℹ️  ステップ2: .env.local に既にCRON_SECRETが存在します（スキップ）"
fi
echo ""

# GitHub CLIの確認
if command -v gh &> /dev/null; then
  echo "✅ ステップ3: GitHub CLI (gh) が利用可能です"
  echo ""

  # GitHubログイン状態を確認
  if gh auth status &> /dev/null; then
    echo "✅ GitHub にログイン済みです"
    echo ""

    read -p "📝 GitHubリポジトリを作成しますか？ (private/public/skip): " REPO_TYPE

    if [ "$REPO_TYPE" = "private" ] || [ "$REPO_TYPE" = "public" ]; then
      VISIBILITY_FLAG="--$REPO_TYPE"

      echo ""
      echo "🔄 GitHubリポジトリを作成中..."

      if gh repo create filter $VISIBILITY_FLAG --source=. --remote=origin --push; then
        echo "✅ GitHubリポジトリの作成とプッシュが完了しました"
        echo ""

        # GitHub Secretsの設定
        echo "🔐 GitHub Secretsを設定中..."

        # CRON_SECRETの設定
        echo "$CRON_SECRET" | gh secret set CRON_SECRET
        echo "✅ CRON_SECRET を設定しました"

        # VERCEL_URLの仮設定
        echo "your-app-name.vercel.app" | gh secret set VERCEL_URL
        echo "✅ VERCEL_URL を仮設定しました（Vercelデプロイ後に更新してください）"

        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎉 GitHub Actions セットアップ完了！"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📋 次のステップ:"
        echo "   1. BRK.B銘柄を処理対象から除外（オプション）"
        echo "   2. Vercelに本番デプロイ"
        echo "   3. GitHub SecretsのVERCEL_URLを実際のURLに更新"
        echo "   4. GitHub Actionsで手動実行してテスト"
        echo ""
        echo "🔗 リポジトリURL:"
        gh repo view --web --json url -q .url

      else
        echo "❌ リポジトリの作成に失敗しました"
        exit 1
      fi
    else
      echo "ℹ️  リポジトリ作成をスキップしました"
    fi
  else
    echo "⚠️  GitHub にログインしていません"
    echo ""
    echo "以下のコマンドを実行してログインしてください:"
    echo "  gh auth login"
  fi
else
  echo "⚠️  GitHub CLI (gh) がインストールされていません"
  echo ""
  echo "以下のコマンドでインストールできます:"
  echo "  brew install gh"
  echo ""
  echo "または、手動でGitHubリポジトリを作成してください。"
  echo "詳細は GITHUB_ACTIONS_SETUP.md を参照してください。"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 重要な情報"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "CRON_SECRET: $CRON_SECRET"
echo ""
echo "⚠️  このシークレットは以下に設定する必要があります:"
echo "   • GitHub Secrets: CRON_SECRET"
echo "   • Vercel環境変数: CRON_SECRET"
echo "   • .env.local: CRON_SECRET ✅ (設定済み)"
echo ""
echo "📖 詳細なセットアップガイド:"
echo "   cat GITHUB_ACTIONS_SETUP.md"
echo ""
