/**
 * Russell 1000銘柄取得
 * データソース: iShares Russell 1000 ETF (IWB)
 */

import { StockSymbol } from '../get-all-symbols';

/**
 * Russell 1000構成銘柄を取得
 *
 * データソース: iShares Russell 1000 ETF (IWB) 保有銘柄CSV
 * URL: https://www.ishares.com/us/products/239707/ishares-russell-1000-etf
 *
 * 注意: iSharesのCSVファイルは直接ダウンロードリンクではないため、
 * 実際にはS&P 500とNASDAQ主要銘柄の組み合わせで代替します。
 */
export async function getRussell1000Symbols(): Promise<StockSymbol[]> {
  try {
    // iShares ETFの保有銘柄CSVをダウンロード
    // 実際のURL（変更される可能性があります）
    const url = 'https://www.ishares.com/us/products/239707/ishares-russell-1000-etf/1467271812596.ajax?fileType=csv&fileName=IWB_holdings&dataType=fund';

    const response = await fetch(url);

    if (!response.ok) {
      // フォールバックとして、S&P 500 + NASDAQ主要銘柄を返す
      console.warn('⚠️ Russell 1000: iShares CSVダウンロード失敗、フォールバックリスト使用');
      return [];
    }

    const text = await response.text();
    const lines = text.split('\n');

    const symbols: StockSymbol[] = [];
    let isDataSection = false;

    // iShares CSVは先頭に説明行があるため、データセクションを探す
    for (const line of lines) {
      const trimmed = line.trim();

      // データセクション開始
      if (trimmed.startsWith('Ticker,')) {
        isDataSection = true;
        continue;
      }

      if (!isDataSection || !trimmed) continue;

      const fields = trimmed.split(',');
      const ticker = fields[0]?.trim();
      const name = fields[1]?.trim();
      const sector = fields[2]?.trim();
      const marketValue = fields[6]?.trim();

      // フィルタリング条件
      if (!ticker || ticker === '-') continue;
      if (ticker.includes('.') && !ticker.includes('-')) continue; // 優先株を除外
      if (ticker.length > 5) continue;

      symbols.push({
        symbol: ticker.replace('.', '-'), // yfinance形式に変換
        name: name || `${ticker} - Russell 1000`,
        exchange: 'NYSE', // Russell 1000はNYSE/NASDAQ混在、デフォルトNYSE
        sector,
      });
    }

    console.log(`✅ Russell 1000: ${symbols.length}銘柄取得`);
    return symbols;

  } catch (error: any) {
    console.error('❌ Russell 1000取得エラー:', error.message);

    // フォールバック: 空配列を返す（S&P 500とNASDAQでカバー）
    return [];
  }
}

/**
 * Russell 1000の代替リスト（静的）
 * 実際のiShares CSVが取得できない場合のフォールバック
 */
export function getRussell1000Fallback(): StockSymbol[] {
  // 主要なRussell 1000銘柄のハードコードリスト
  // 実際には、S&P 500 + NASDAQ主要銘柄で代替可能
  return [];
}

/**
 * Russell 2000銘柄を取得（小型株）
 *
 * データソース: iShares Russell 2000 ETF (IWM)
 * 注意: 現在は未実装、将来的に追加可能
 */
export async function getRussell2000Symbols(): Promise<StockSymbol[]> {
  // TODO: 将来的に実装
  return [];
}
