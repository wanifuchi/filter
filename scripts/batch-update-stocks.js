/**
 * GitHub Actions用バッチ更新スクリプト
 *
 * 全6,000+銘柄をVercel APIに送信してデータ更新
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 環境変数
const VERCEL_API_URL = process.env.VERCEL_API_URL;
const CRON_SECRET = process.env.CRON_SECRET;
const START_INDEX = parseInt(process.env.START_INDEX || '0', 10);
const END_INDEX = process.env.END_INDEX ? parseInt(process.env.END_INDEX, 10) : null;
const TEST_MODE = process.env.TEST_MODE === 'true';

// 銘柄リストを読み込み
const symbolsPath = path.join(__dirname, '../public/all-symbols-list.json');
let symbols = [];

try {
  symbols = JSON.parse(fs.readFileSync(symbolsPath, 'utf-8'));
  console.log(`✅ ${symbols.length}銘柄を読み込みました`);
} catch (error) {
  console.error('❌ 銘柄リストの読み込みに失敗しました:', error.message);
  process.exit(1);
}

// バリデーション
if (!VERCEL_API_URL) {
  console.error('❌ VERCEL_API_URL が設定されていません');
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET が設定されていません');
  process.exit(1);
}

// テストモードの場合は10銘柄のみ
if (TEST_MODE) {
  symbols = symbols.slice(0, 10);
  console.log('🧪 テストモード: 最初の10銘柄のみ処理します');
}

// 範囲指定がある場合
if (START_INDEX > 0 || END_INDEX) {
  const end = END_INDEX || symbols.length;
  symbols = symbols.slice(START_INDEX, end);
  console.log(`📊 範囲指定: ${START_INDEX} ~ ${end} (${symbols.length}銘柄)`);
}

// ログディレクトリ作成
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ログファイル
const logFile = path.join(logsDir, `update-${new Date().toISOString().split('T')[0]}.log`);
const errorFile = path.join(logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`);

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

function logError(symbol, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ${symbol}: ${error}`;
  console.error(errorMessage);
  fs.appendFileSync(errorFile, errorMessage + '\n');
}

// 統計情報
const stats = {
  total: symbols.length,
  success: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now(),
};

// メイン処理
async function updateAllStocks() {
  log(`🚀 バッチ更新開始: ${stats.total}銘柄`);
  log(`API URL: ${VERCEL_API_URL}`);

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const progress = ((i + 1) / symbols.length * 100).toFixed(2);

    try {
      log(`[${i + 1}/${symbols.length}] (${progress}%) Processing ${symbol}...`);

      const response = await axios.post(
        `${VERCEL_API_URL}/api/process-stock`,
        { symbol },
        {
          headers: {
            'Authorization': `Bearer ${CRON_SECRET}`,
            'Content-Type': 'application/json',
          },
          timeout: 9000, // 9秒でタイムアウト（10秒制限のため）
        }
      );

      if (response.status === 200 && response.data.success) {
        stats.success++;
        log(`✅ ${symbol} - 成功 (${response.data.duration})`);
      } else {
        stats.failed++;
        logError(symbol, `Unexpected response: ${JSON.stringify(response.data)}`);
      }

    } catch (error) {
      stats.failed++;

      if (error.response) {
        // サーバーからのエラーレスポンス
        logError(symbol, `HTTP ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      } else if (error.request) {
        // リクエストタイムアウトまたはネットワークエラー
        logError(symbol, `Network error: ${error.message}`);
      } else {
        // その他のエラー
        logError(symbol, error.message);
      }
    }

    // Yahoo Finance APIのレート制限対策: 18秒待機
    // 2,000 calls/hour = 3,600秒 / 2,000 = 1.8秒/call
    // 安全マージンとして18秒（実質200 calls/hour）
    if (i < symbols.length - 1) {
      const waitTime = TEST_MODE ? 2000 : 18000; // テストモードは2秒、本番は18秒
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // 進捗状況を定期的に報告（100銘柄ごと）
    if ((i + 1) % 100 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);
      const successRate = ((stats.success / (i + 1)) * 100).toFixed(2);
      log(`📊 進捗: ${i + 1}/${stats.total} | 成功率: ${successRate}% | 経過時間: ${elapsed}分`);
    }
  }

  // 最終レポート
  const totalTime = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);
  const successRate = ((stats.success / stats.total) * 100).toFixed(2);

  log('\n' + '='.repeat(60));
  log('✨ バッチ更新完了');
  log('='.repeat(60));
  log(`📊 統計情報:`);
  log(`   - 合計銘柄数: ${stats.total}`);
  log(`   - 成功: ${stats.success} (${successRate}%)`);
  log(`   - 失敗: ${stats.failed}`);
  log(`   - スキップ: ${stats.skipped}`);
  log(`   - 実行時間: ${totalTime}分`);
  log('='.repeat(60));

  // 失敗が多い場合は終了コード1を返す
  if (stats.failed > stats.total * 0.1) {
    log('⚠️ 警告: 10%以上の銘柄が失敗しました');
    process.exit(1);
  }

  log('🎉 完了！');
}

// 実行
updateAllStocks().catch(error => {
  log(`❌ 致命的なエラー: ${error.message}`);
  log(error.stack);
  process.exit(1);
});
