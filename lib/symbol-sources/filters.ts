/**
 * 銘柄フィルタリングユーティリティ
 */

import { StockSymbol } from '../get-all-symbols';

/**
 * 重複銘柄を除去
 */
export function removeDuplicates(symbols: StockSymbol[]): StockSymbol[] {
  const uniqueMap = new Map<string, StockSymbol>();

  for (const symbol of symbols) {
    // 既存のエントリーがない、またはより詳細な情報がある場合のみ更新
    const existing = uniqueMap.get(symbol.symbol);

    if (!existing) {
      uniqueMap.set(symbol.symbol, symbol);
    } else {
      // より詳細な情報（セクター、産業）がある方を優先
      if ((symbol.sector && !existing.sector) || (symbol.industry && !existing.industry)) {
        uniqueMap.set(symbol.symbol, symbol);
      }
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * 無効なシンボルを除外
 */
export function filterInvalidSymbols(symbols: StockSymbol[]): StockSymbol[] {
  return symbols.filter(s => {
    // 基本的なバリデーション
    if (!s.symbol || s.symbol.length === 0) return false;
    if (s.symbol.length > 5) return false; // 長すぎるシンボルを除外

    // 特殊文字チェック（ハイフンのみ許可）
    if (!/^[A-Z0-9-]+$/.test(s.symbol)) return false;

    // テストシンボルを除外
    if (s.symbol.startsWith('TEST')) return false;
    if (s.symbol.includes('_')) return false;

    // 優先株を除外（オプション）
    // 例: AAPL-PR, BRK.B など
    if (s.symbol.includes('.') && !s.symbol.includes('-')) return false;

    return true;
  });
}

/**
 * 時価総額でフィルタリング
 *
 * @param symbols - 銘柄リスト
 * @param minMarketCap - 最低時価総額（ドル）
 */
export function filterByMarketCap(
  symbols: StockSymbol[],
  minMarketCap: number = 100_000_000 // デフォルト: $100M以上
): StockSymbol[] {
  return symbols.filter(s => {
    if (!s.marketCap) return true; // 時価総額情報がない場合は保持
    return s.marketCap >= minMarketCap;
  });
}

/**
 * ETFを除外
 */
export function filterOutETFs(symbols: StockSymbol[]): StockSymbol[] {
  const etfKeywords = ['ETF', 'FUND', 'TRUST', 'INDEX', 'SPDR', 'iShares', 'Vanguard'];

  return symbols.filter(s => {
    const nameUpper = s.name.toUpperCase();
    return !etfKeywords.some(keyword => nameUpper.includes(keyword));
  });
}

/**
 * ADR（米国預託証券）を除外（オプション）
 */
export function filterOutADRs(symbols: StockSymbol[]): StockSymbol[] {
  const adrKeywords = ['ADR', 'ADS', 'SPONSORED', 'DEPOSITARY'];

  return symbols.filter(s => {
    const nameUpper = s.name.toUpperCase();
    return !adrKeywords.some(keyword => nameUpper.includes(keyword));
  });
}

/**
 * 優先株を除外
 */
export function filterOutPreferredStocks(symbols: StockSymbol[]): StockSymbol[] {
  return symbols.filter(s => {
    // シンボルに優先株を示す文字列が含まれていないか確認
    if (s.symbol.includes('-P')) return false; // 例: AAPL-PR
    if (s.symbol.match(/-[A-Z]$/)) return false; // 例: BRK-A, BRK-B は保持

    // 名前に優先株を示す文字列が含まれていないか確認
    const nameUpper = s.name.toUpperCase();
    if (nameUpper.includes('PREFERRED')) return false;
    if (nameUpper.includes('PREF')) return false;

    return true;
  });
}

/**
 * 取引所でフィルタリング
 */
export function filterByExchange(
  symbols: StockSymbol[],
  exchanges: Array<'NYSE' | 'NASDAQ' | 'AMEX'>
): StockSymbol[] {
  return symbols.filter(s => exchanges.includes(s.exchange));
}

/**
 * セクターでフィルタリング
 */
export function filterBySector(symbols: StockSymbol[], sectors: string[]): StockSymbol[] {
  return symbols.filter(s => {
    if (!s.sector) return false;
    return sectors.includes(s.sector);
  });
}

/**
 * 包括的なフィルタリング処理
 *
 * すべての基本的なフィルタリングを適用
 */
export function applyStandardFilters(
  symbols: StockSymbol[],
  options: {
    removeETFs?: boolean;
    removeADRs?: boolean;
    removePreferredStocks?: boolean;
    minMarketCap?: number;
    exchanges?: Array<'NYSE' | 'NASDAQ' | 'AMEX'>;
  } = {}
): StockSymbol[] {
  let filtered = symbols;

  // 1. 無効なシンボルを除外
  filtered = filterInvalidSymbols(filtered);

  // 2. 重複を除去
  filtered = removeDuplicates(filtered);

  // 3. ETFを除外（オプション）
  if (options.removeETFs !== false) {
    filtered = filterOutETFs(filtered);
  }

  // 4. ADRを除外（オプション）
  if (options.removeADRs) {
    filtered = filterOutADRs(filtered);
  }

  // 5. 優先株を除外（オプション）
  if (options.removePreferredStocks !== false) {
    filtered = filterOutPreferredStocks(filtered);
  }

  // 6. 時価総額でフィルタリング（オプション）
  if (options.minMarketCap) {
    filtered = filterByMarketCap(filtered, options.minMarketCap);
  }

  // 7. 取引所でフィルタリング（オプション）
  if (options.exchanges) {
    filtered = filterByExchange(filtered, options.exchanges);
  }

  return filtered;
}

/**
 * 優先度を計算（Tier 1-4）
 *
 * Tier 1: 大型株（時価総額 $10B以上）- 毎日更新
 * Tier 2: 中型株（時価総額 $1B-$10B）- 2日に1回更新
 * Tier 3: 小型株（時価総額 $100M-$1B）- 週1回更新
 * Tier 4: 超小型株（時価総額 $100M未満）- 月1回更新
 */
export function assignTier(symbol: StockSymbol): number {
  if (!symbol.marketCap) return 3; // デフォルト: Tier 3

  if (symbol.marketCap >= 10_000_000_000) return 1; // $10B以上
  if (symbol.marketCap >= 1_000_000_000) return 2;  // $1B-$10B
  if (symbol.marketCap >= 100_000_000) return 3;    // $100M-$1B
  return 4;                                          // $100M未満
}

/**
 * Tierごとに銘柄を分類
 */
export function groupByTier(symbols: StockSymbol[]): Record<number, StockSymbol[]> {
  const tiers: Record<number, StockSymbol[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };

  for (const symbol of symbols) {
    const tier = assignTier(symbol);
    tiers[tier].push(symbol);
  }

  return tiers;
}
