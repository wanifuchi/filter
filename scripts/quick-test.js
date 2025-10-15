/**
 * クイックAPIテスト（Node.js版）
 *
 * 実行方法:
 * CRON_SECRET=your-secret node scripts/quick-test.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const CRON_SECRET = process.env.CRON_SECRET || 'test-secret-123';

async function testAPI(symbol) {
  console.log(`\n🔍 テスト: ${symbol}`);
  console.log('━'.repeat(50));

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/process-stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol }),
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ 成功 (${duration}ms)`);
      console.log(`   価格: $${data.data?.price?.toFixed(2) || 'N/A'}`);
      console.log(`   AIスコア: ${data.data?.aiScore || 'N/A'}`);
      console.log(`   投資判断: ${data.data?.decision || 'N/A'}`);
      console.log(`   処理時間: ${data.duration}`);
    } else {
      console.log(`❌ 失敗 (HTTP ${response.status})`);
      console.log(`   エラー: ${data.error || 'Unknown error'}`);
    }

    return { success: response.ok, duration, data };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ 例外発生 (${duration}ms)`);
    console.log(`   エラー: ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function main() {
  console.log('🧪 API エンドポイントテスト開始');
  console.log('='.repeat(50));
  console.log(`📍 URL: ${API_URL}/api/process-stock`);
  console.log(`🔐 認証: Bearer ${CRON_SECRET.substring(0, 10)}...`);

  const testSymbols = ['AAPL', 'MSFT', 'GOOGL'];
  const results = {
    total: testSymbols.length,
    success: 0,
    failed: 0,
    totalDuration: 0,
  };

  for (const symbol of testSymbols) {
    const result = await testAPI(symbol);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }

    results.totalDuration += result.duration;

    // 次のテストまで2秒待機
    if (symbol !== testSymbols[testSymbols.length - 1]) {
      console.log('\n⏳ 2秒待機...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 テスト結果サマリー');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${results.success}/${results.total}`);
  console.log(`❌ 失敗: ${results.failed}/${results.total}`);
  console.log(`⏱️  合計時間: ${results.totalDuration}ms`);
  console.log(`📈 平均時間: ${(results.totalDuration / results.total).toFixed(0)}ms/銘柄`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n⚠️ 一部のテストが失敗しました');
    process.exit(1);
  } else {
    console.log('\n✨ すべてのテストが成功しました！');
  }
}

main().catch(error => {
  console.error('❌ 致命的エラー:', error);
  process.exit(1);
});
