/**
 * 全銘柄バッチ処理APIのローカルテストスクリプト
 *
 * 使用方法:
 *   node scripts/test-batch-all.js
 *
 * 注意:
 *   - 開発サーバーが localhost:3001 で起動している必要があります
 *   - .env.local に CRON_SECRET が設定されている必要があります
 *   - 全銘柄を処理するため、実行時間が長くなります（銘柄数 × 18秒）
 */

require('dotenv').config({ path: '.env.local' });

const API_URL = 'http://localhost:3001/api/batch-all';
const CRON_SECRET = process.env.CRON_SECRET;

async function testBatchAll() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 全銘柄バッチ処理APIテスト');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`🔑 CRON_SECRET: ${CRON_SECRET ? '設定済み ✅' : '未設定 ❌'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!CRON_SECRET) {
    console.error('❌ エラー: CRON_SECRET が .env.local に設定されていません');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    console.log('🚀 バッチ処理を開始します...\n');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });

    const data = await response.json();
    const endTime = Date.now();
    const totalDuration = Math.round((endTime - startTime) / 1000);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 HTTP Status: ${response.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!response.ok) {
      console.error('❌ バッチ処理が失敗しました\n');
      console.error('エラー詳細:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    // 成功レスポンスの表示
    console.log('✅ バッチ処理が正常に完了しました\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 処理結果サマリー');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Job ID:          ${data.job_id}`);
    console.log(`  対象銘柄数:      ${data.results.total}`);
    console.log(`  処理済み:        ${data.results.processed}`);
    console.log(`  成功:            ${data.results.succeeded} ✅`);
    console.log(`  失敗:            ${data.results.failed} ${data.results.failed > 0 ? '⚠️' : '✅'}`);
    console.log(`  処理時間:        ${data.duration_seconds}秒 (${Math.round(data.duration_seconds / 60)}分)`);
    console.log(`  平均処理時間:    ${(data.duration_seconds / data.results.total).toFixed(1)}秒/銘柄`);
    console.log(`  成功率:          ${((data.results.succeeded / data.results.total) * 100).toFixed(1)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // エラー詳細の表示
    if (data.results.errors && data.results.errors.length > 0) {
      console.log('⚠️  エラーが発生した銘柄:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      data.results.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.symbol}: ${err.error}`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log('🎉 テスト完了！');
    console.log(`   総実行時間: ${totalDuration}秒 (${Math.round(totalDuration / 60)}分)\n`);

  } catch (error) {
    console.error('\n❌ テスト失敗\n');
    console.error('エラー詳細:', error.message);
    console.error('スタックトレース:', error.stack);
    process.exit(1);
  }
}

// テスト実行
testBatchAll();
