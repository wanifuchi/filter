/**
 * 全銘柄リストを生成してJSONファイルに出力
 *
 * 実行方法:
 * npx tsx scripts/generate-symbols.ts
 */

import { getAllUSStockSymbolsDynamic } from '../lib/get-all-symbols';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 全銘柄リスト生成開始...\n');

  try {
    // 全銘柄を取得
    const symbols = await getAllUSStockSymbolsDynamic();

    console.log(`\n✅ 合計 ${symbols.length} 銘柄を取得しました`);

    // public/all-symbols.jsonに保存
    const outputPath = path.join(process.cwd(), 'public', 'all-symbols.json');

    // publicディレクトリが存在しない場合は作成
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // JSONファイルとして保存
    fs.writeFileSync(outputPath, JSON.stringify(symbols, null, 2));

    console.log(`\n💾 保存完了: ${outputPath}`);
    console.log(`   ファイルサイズ: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

    // シンボルのみのリストも生成（GitHub Actions用）
    const symbolsOnly = symbols.map(s => s.symbol);
    const symbolsOnlyPath = path.join(process.cwd(), 'public', 'all-symbols-list.json');
    fs.writeFileSync(symbolsOnlyPath, JSON.stringify(symbolsOnly, null, 2));

    console.log(`\n💾 シンボルリスト保存: ${symbolsOnlyPath}`);

    // 統計情報を表示
    console.log('\n📊 銘柄統計:');

    const byExchange = symbols.reduce((acc, s) => {
      acc[s.exchange] = (acc[s.exchange] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [exchange, count] of Object.entries(byExchange)) {
      console.log(`   - ${exchange}: ${count}銘柄`);
    }

    // サンプル銘柄を表示
    console.log('\n📝 サンプル銘柄（最初の10個）:');
    symbols.slice(0, 10).forEach(s => {
      console.log(`   ${s.symbol} - ${s.name} (${s.exchange})`);
    });

    console.log('\n✨ 完了！');

  } catch (error: any) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
