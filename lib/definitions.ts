/**
 * 型定義ファイル
 * APIレスポンス、株式データ、フィルター条件などの型を定義
 */

// ============================================
// 銘柄データ型
// ============================================

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  market_cap: number;
  current_price: number;
  exchange: string;
  country: string;
}

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  price: number;
  ma_10: number | null;
  ma_20: number | null;
  ma_50: number | null;
  ma_150: number | null;
  ma_200: number | null;
  rsi_14: number | null;
  adr_20: number | null;
  vwap: number | null;
  volume_avg_20: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  distance_ma_10: number | null;
  distance_ma_200: number | null;
  perfect_order_bullish: boolean;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma_10?: number | null;
  ma_20?: number | null;
  ma_50?: number | null;
  ma_200?: number | null;
}

export interface InvestmentDecision {
  action: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  reasons: string[];
}

export interface PriceLevels {
  // 保有者向け利確ポイント
  profitTargets: {
    target1: {
      price: number;
      gain: number;
      gainPercent: number;
      description: string;
    };
    target2: {
      price: number;
      gain: number;
      gainPercent: number;
      description: string;
    };
    target3: {
      price: number;
      gain: number;
      gainPercent: number;
      description: string;
    };
  };
  // 新規購入者向けエントリーポイント
  entryPoints: {
    optimal: {
      price: number;
      reason: string;
      discount: number;
      discountPercent: number;
    };
    acceptable: {
      price: number;
      reason: string;
    };
    stopLoss: {
      price: number;
      reason: string;
      maxLoss: number;
      maxLossPercent: number;
    };
  };
}

export interface DetailedAnalysis {
  currentSituation: {
    symbol: string;
    name: string;
    price: number;
    decision: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
  };
  strengths: Array<{
    title: string;
    description: string;
    score: number;
  }>;
  concerns: Array<{
    title: string;
    description: string;
    score: number;
  }>;
  scoring: {
    buyScore: number;
    buyDetails: string[];
    sellScore: number;
    sellDetails: string[];
  };
  decisionCriteria: {
    buyThreshold: string;
    sellThreshold: string;
    actualResult: string;
  };
  stockCharacteristics?: {
    type: string;
    warnings: string[];
  };
  priceLevels?: PriceLevels;
  recommendation: {
    summary: string[];
    forHolders: string;
    forNewBuyers: string;
    waitingConditions: string[];
  };
}

export interface StockWithIndicators extends Stock {
  technical_indicators: TechnicalIndicators;
  score: number;
  historical_data?: HistoricalDataPoint[];
  change_1d: number;
  volume_ratio: number;
  dollar_volume: number;
  investment_decision?: InvestmentDecision;
  detailed_analysis?: DetailedAnalysis;
}

// ============================================
// フィルター条件型
// ============================================

export interface MovingAverageFilter {
  ma_10?: boolean;
  ma_20?: boolean;
  ma_50?: boolean;
  ma_150?: boolean;
  ma_200?: boolean;
}

export interface MovingAverageAlignment {
  enabled: boolean;
  order: 'bullish' | 'bearish';
}

export interface RangeFilter {
  min: number;
  max: number;
}

export interface MADeviationFilter {
  ma_10?: RangeFilter;
  ma_21?: RangeFilter;
  ma_50?: RangeFilter;
}

export interface PriceContraction {
  enabled: boolean;
  period_short: number;
  period_long: number;
  ratio: number;
}

export interface GapFilter {
  type: 'up' | 'down' | 'any';
  min_percent: number;
  unfilled: boolean;
}

export interface Week52Filter {
  near_high?: boolean;
  new_high?: boolean;
  near_low?: boolean;
  new_low?: boolean;
}

export interface VolumeFilter {
  avg_volume_min?: number;
  volume_surge?: number;
  dollar_volume_min?: number;
}

export interface TechnicalFilters {
  price_above_ma?: MovingAverageFilter;
  ma_alignment?: MovingAverageAlignment;
  ma_deviation?: MADeviationFilter;
  adr_20?: RangeFilter;
  price_contraction?: PriceContraction;
  gap?: GapFilter;
  week_52?: Week52Filter;
  volume?: VolumeFilter;
  rsi_14?: RangeFilter;
  vwap?: {
    above?: boolean;
    below?: boolean;
    deviation_percent?: number;
  };
}

export interface FundamentalFilters {
  market_cap?: RangeFilter;
  price_range?: RangeFilter;
  sectors?: string[];
  liquidity?: {
    min_dollar_volume?: number;
    min_shares_volume?: number;
  };
  country?: string[];
  exchange?: string[];
}

export interface ScreeningFilters {
  technical: TechnicalFilters;
  fundamental: FundamentalFilters;
}

// ============================================
// プリセット戦略型
// ============================================

export interface PresetStrategy {
  id: string;
  name: string;
  description: string;
  filters: ScreeningFilters;
}

export const PRESET_STRATEGIES: PresetStrategy[] = [
  {
    id: 'short_term_momentum',
    name: '短期上昇候補',
    description: 'ADR高、流動性高、200MA以上、強いセクター',
    filters: {
      technical: {
        price_above_ma: { ma_200: true },
        adr_20: { min: 4, max: 100 },
        volume: {
          dollar_volume_min: 60_000_000,
          volume_surge: 1.5,
        },
      },
      fundamental: {},
    },
  },
  {
    id: 'pullback_buy',
    name: '押し目買い候補',
    description: '10EMA近辺、21/50EMAは上、流動性高',
    filters: {
      technical: {
        ma_deviation: {
          ma_10: { min: -3, max: 0.5 },
          ma_21: { min: 0, max: 3 },
          ma_50: { min: 0, max: 8 },
        },
        price_contraction: {
          enabled: true,
          period_short: 5,
          period_long: 20,
          ratio: 0.5,
        },
        volume: {
          dollar_volume_min: 60_000_000,
        },
      },
      fundamental: {},
    },
  },
  {
    id: 'perfect_order',
    name: '移動平均線パーフェクトオーダー',
    description: '10>20>50>150>200の理想的な並び',
    filters: {
      technical: {
        ma_alignment: {
          enabled: true,
          order: 'bullish',
        },
        adr_20: { min: 4, max: 100 },
      },
      fundamental: {},
    },
  },
  {
    id: 'week_52_breakout',
    name: '52週高値ブレイクアウト',
    description: '新高値更新銘柄、強いモメンタム',
    filters: {
      technical: {
        week_52: { new_high: true },
        volume: { volume_surge: 2.0 },
        rsi_14: { min: 50, max: 80 },
      },
      fundamental: {},
    },
  },
  {
    id: 'gap_fill',
    name: '窓埋め候補',
    description: '大きな窓開け後、サポートライン付近',
    filters: {
      technical: {
        gap: {
          type: 'any',
          min_percent: 3,
          unfilled: true,
        },
        price_above_ma: { ma_200: true },
      },
      fundamental: {},
    },
  },
  {
    id: 'top_10_recommended',
    name: '総合評価おすすめベスト10',
    description: '上昇トレンドが確認され、買いシグナルが出ている優良銘柄トップ10を選出',
    filters: {
      technical: {
        price_above_ma: { ma_200: true },
        perfect_order_bullish: true,
        adr_20: { min: 2, max: 100 },
        rsi_14: { min: 30, max: 55 },
        volume: {
          dollar_volume_min: 50_000_000,
        },
      },
      fundamental: {},
    },
  },
];

// ============================================
// APIレスポンス型
// ============================================

export interface ScreeningRequest {
  filters: ScreeningFilters;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    per_page: number;
  };
}

export interface ScreeningResponse {
  results: StockWithIndicators[];
  total_count: number;
  page: number;
  per_page: number;
  execution_time_ms: number;
}

export interface StockDetailResponse {
  basic_info: Stock;
  price_info: {
    current: number;
    change: number;
    change_percent: number;
    open: number;
    high: number;
    low: number;
    previous_close: number;
    week_52_high: number;
    week_52_low: number;
  };
  technical_indicators: TechnicalIndicators;
  fundamental_data: {
    pe_ratio: number | null;
    forward_pe: number | null;
    peg_ratio: number | null;
    price_to_book: number | null;
  };
  themes: string[];
  upcoming_events: {
    earnings_date: string | null;
    dividend_date: string | null;
  };
}

export interface ChartDataResponse {
  dates: string[];
  prices: number[];
  volumes: number[];
  ma_10: number[];
  ma_20: number[];
  ma_50: number[];
}

// ============================================
// セクター分析型
// ============================================

export interface SectorPerformance {
  sector: string;
  etf_symbol: string;
  change_1w: number;
  change_1m: number;
  change_3m: number;
  rank: number;
  trend: 'up' | 'down';
  stocks_above_200ma_pct: number;
}

// ============================================
// カレンダー型
// ============================================

export interface EarningsEvent {
  date: string;
  symbol: string;
  name: string;
  fiscal_quarter: string;
  estimate_eps: number;
  actual_eps: number | null;
  surprise_percent: number | null;
  time: 'BMO' | 'AMC'; // Before Market Open / After Market Close
}

// ============================================
// 市場環境型
// ============================================

export interface MarketRegime {
  spy_tlt_ratio: number;
  vug_vtv_ratio: number;
  vix: number;
  credit_spread: number;
  stocks_above_200ma: number;
  regime: 'risk_on' | 'risk_off' | 'neutral';
  confidence: number;
}

export interface MarketBreadth {
  sp500_above_20ma: number;
  sp500_above_50ma: number;
  sp500_above_200ma: number;
  nasdaq_above_20ma: number;
  nasdaq_above_50ma: number;
  nasdaq_above_200ma: number;
}
