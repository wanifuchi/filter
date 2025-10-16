import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * Supabaseからバッチ処理済みの株式データを取得するAPIエンドポイント
 *
 * クエリパラメータ:
 * - limit: 取得件数（デフォルト: 100）
 * - symbol: 銘柄シンボルでフィルタ（オプション）
 * - date: 日付でフィルタ（YYYY-MM-DD形式、オプション）
 * - min_score: 最小AIスコアでフィルタ（0-100、オプション）
 * - decision: 投資判断でフィルタ（BUY/HOLD/SELL、オプション）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const symbol = searchParams.get('symbol');
    const date = searchParams.get('date');
    const minScore = searchParams.get('min_score');
    const decision = searchParams.get('decision');

    // クエリビルダーを初期化（stocks テーブルと JOIN）
    let query = supabase
      .from('stock_data')
      .select(`
        *,
        stocks (
          name,
          sector,
          industry
        )
      `);

    // フィルタ条件を適用
    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (minScore) {
      const scoreValue = parseInt(minScore, 10);
      if (scoreValue >= 0 && scoreValue <= 100) {
        query = query.gte('ai_score', scoreValue);
      }
    }

    if (decision && ['BUY', 'HOLD', 'SELL'].includes(decision.toUpperCase())) {
      query = query.eq('investment_decision', decision.toUpperCase());
    }

    // ソート順序: 日付降順 → AIスコア降順
    query = query
      .order('date', { ascending: false })
      .order('ai_score', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'データ取得に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: '該当するデータが見つかりませんでした', data: [] },
        { status: 200 }
      );
    }

    // フロントエンドが期待する形式に変換
    const transformedData = data.map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.stocks?.name || stock.symbol,
      sector: stock.stocks?.sector || 'N/A',
      industry: stock.stocks?.industry || 'N/A',
      current_price: stock.current_price,
      market_cap: stock.market_cap,
      ai_score: stock.ai_score,
      investment_decision: stock.investment_decision,
      date: stock.date,
      technical_indicators: {
        ma_10: stock.ma_10,
        ma_20: stock.ma_20,
        ma_50: stock.ma_50,
        ma_200: stock.ma_200,
        rsi_14: stock.rsi_14,
        adr_20: stock.adr_20,
        volume_avg_20: stock.volume_avg_20,
        perfect_order_bullish: stock.perfect_order_bullish,
      },
      detailed_analysis: {
        ai_prediction: stock.ai_prediction,
        ai_reasoning: stock.ai_reasoning,
        ai_confidence: stock.ai_confidence,
      },
    }));

    // レスポンスメタデータを追加
    const response = {
      count: transformedData.length,
      filters: {
        symbol: symbol || 'all',
        date: date || 'all',
        min_score: minScore || 'none',
        decision: decision || 'all',
      },
      data: transformedData,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
