/**
 * NYSE全銘柄取得
 * データソース: Nasdaq Trader FTP
 */

import { StockSymbol } from '../get-all-symbols';

/**
 * NYSE上場銘柄を取得
 *
 * データソース: ftp://ftp.nasdaqtrader.com/symboldirectory/otherlisted.txt
 * フォーマット: パイプ区切り（|）
 *
 * 注意: FTPアクセスはNode.js環境でのみ動作します
 */
export async function getNYSESymbols(): Promise<StockSymbol[]> {
  try {
    // Nasdaq Trader FTP: NYSE銘柄リスト
    const url = 'https://www.nasdaqtrader.com/dynamic/symdir/otherlisted.txt';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');

    const symbols: StockSymbol[] = [];

    // ヘッダー行とフッター行をスキップ
    for (let i = 1; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split('|');

      // フォーマット: ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol
      const actSymbol = fields[0]?.trim();
      const securityName = fields[1]?.trim();
      const exchange = fields[2]?.trim();
      const isETF = fields[4]?.trim() === 'Y';
      const isTestIssue = fields[5]?.trim() === 'Y';

      // フィルタリング条件
      if (!actSymbol || !securityName) continue;
      if (isTestIssue) continue; // テスト銘柄を除外
      if (actSymbol.includes('.') && !actSymbol.includes('-')) continue; // 優先株を除外（BRK-Bなどは保持）
      if (actSymbol.length > 5) continue; // 長すぎるシンボルを除外

      // 取引所判定
      let stockExchange: 'NYSE' | 'NASDAQ' | 'AMEX' = 'NYSE';
      if (exchange === 'A') stockExchange = 'AMEX';
      else if (exchange === 'N') stockExchange = 'NYSE';
      else if (exchange === 'P') stockExchange = 'NYSE'; // NYSE Arca
      else if (exchange === 'Z') stockExchange = 'NYSE'; // BATS

      symbols.push({
        symbol: actSymbol.replace('.', '-'), // yfinance形式に変換
        name: securityName,
        exchange: stockExchange,
      });
    }

    console.log(`✅ NYSE: ${symbols.length}銘柄取得`);
    return symbols;

  } catch (error: any) {
    console.error('❌ NYSE銘柄取得エラー:', error.message);
    return [];
  }
}

/**
 * NYSE大型株のみフィルタリング（オプション）
 */
export function filterNYSELargeCap(symbols: StockSymbol[]): StockSymbol[] {
  // 時価総額データがない場合は、シンボルの長さでフィルタリング
  // 通常、大型株は1-4文字のシンボルが多い
  return symbols.filter(s => s.symbol.length <= 4);
}
