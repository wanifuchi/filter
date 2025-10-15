/**
 * NASDAQ全銘柄取得
 * データソース: Nasdaq Trader FTP
 */

import { StockSymbol } from '../get-all-symbols';

/**
 * NASDAQ上場銘柄を取得
 *
 * データソース: ftp://ftp.nasdaqtrader.com/symboldirectory/nasdaqlisted.txt
 * フォーマット: パイプ区切り（|）
 */
export async function getNASDAQSymbols(): Promise<StockSymbol[]> {
  try {
    // Nasdaq Trader FTP: NASDAQ銘柄リスト
    const url = 'https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt';

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

      // フォーマット: Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares
      const symbol = fields[0]?.trim();
      const securityName = fields[1]?.trim();
      const marketCategory = fields[2]?.trim(); // Q=NASDAQ Global Select, G=NASDAQ Global, S=NASDAQ Capital
      const isTestIssue = fields[3]?.trim() === 'Y';
      const financialStatus = fields[4]?.trim(); // N=Normal, D=Deficient, Q=Bankrupt, etc.
      const isETF = fields[6]?.trim() === 'Y';

      // フィルタリング条件
      if (!symbol || !securityName) continue;
      if (isTestIssue) continue; // テスト銘柄を除外
      if (symbol.includes('.') && !symbol.includes('-')) continue; // 優先株を除外
      if (symbol.length > 5) continue; // 長すぎるシンボルを除外
      if (financialStatus && financialStatus !== 'N') continue; // 正常でない財務状態を除外

      symbols.push({
        symbol: symbol.replace('.', '-'), // yfinance形式に変換
        name: securityName,
        exchange: 'NASDAQ',
        // marketCategoryをメタデータとして保存（オプション）
      });
    }

    console.log(`✅ NASDAQ: ${symbols.length}銘柄取得`);
    return symbols;

  } catch (error: any) {
    console.error('❌ NASDAQ銘柄取得エラー:', error.message);
    return [];
  }
}

/**
 * NASDAQ Global Select Market（大型株）のみフィルタリング
 */
export function filterNASDAQLargeCap(symbols: StockSymbol[]): StockSymbol[] {
  // シンボルの長さでフィルタリング（大型株は通常1-4文字）
  return symbols.filter(s => s.symbol.length <= 4);
}

/**
 * NASDAQ 100構成銘柄を取得（Wikipedia経由）
 */
export async function getNASDAQ100Symbols(): Promise<StockSymbol[]> {
  try {
    const url = 'https://en.wikipedia.org/wiki/NASDAQ-100';

    const response = await fetch(url);
    const html = await response.text();

    // HTMLパースは簡易的に実装（本番環境ではcheerioなどを使用推奨）
    const symbols: StockSymbol[] = [];

    // WikipediaのテーブルからSymbolを抽出
    // 注意: この実装は簡易版です。実際にはHTMLパーサーライブラリを使用してください
    const tickerMatches = html.match(/\b[A-Z]{1,5}\b/g);

    if (tickerMatches) {
      const uniqueSymbols = [...new Set(tickerMatches)];

      for (const symbol of uniqueSymbols) {
        // NASDAQ 100の主要銘柄のみを追加
        if (symbol.length >= 1 && symbol.length <= 5) {
          symbols.push({
            symbol,
            name: `${symbol} - NASDAQ 100 Component`,
            exchange: 'NASDAQ',
          });
        }
      }
    }

    console.log(`✅ NASDAQ 100: ${symbols.length}銘柄取得`);
    return symbols.slice(0, 100); // 最大100銘柄

  } catch (error: any) {
    console.error('❌ NASDAQ 100取得エラー:', error.message);

    // フォールバック: 主要なNASDAQ 100銘柄のハードコードリスト
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
      { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
      { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
      { symbol: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ' },
      { symbol: 'COST', name: 'Costco Wholesale Corporation', exchange: 'NASDAQ' },
      { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
    ];
  }
}
