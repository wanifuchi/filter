/**
 * 高速スクリーニングAPI（Supabaseベース）
 *
 * Yahoo Financeから直接取得する代わりに、Supabaseにキャッシュされたデータをクエリします。
 * 応答時間: 6-8秒 → <200ms
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { PRESET_STRATEGIES, ScreeningFilters } from '@/lib/definitions';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { preset_id, filters: customFilters } = body;

    // フィルター条件の決定
    let filters: ScreeningFilters;
    if (preset_id) {
      const preset = PRESET_STRATEGIES.find(p => p.id === preset_id);
      if (!preset) {
        return NextResponse.json({ error: '無効なプリセットIDです' }, { status: 400 });
      }
      filters = preset.filters;
    } else if (customFilters) {
      filters = customFilters;
    } else {
      return NextResponse.json(
        { error: 'preset_id または filters を指定してください' },
        { status: 400 }
      );
    }

    // Supabaseクライアント取得
    const supabase = getSupabaseClient();

    // 最新の日付のデータを取得
    const today = new Date().toISOString().split('T')[0];

    // クエリ構築
    let query = supabase
      .from('stock_data')
      .select(
        `
        symbol,
        date,
        current_price,
        volume,
        dollar_volume,
        ma_10,
        ma_20,
        ma_50,
        ma_200,
        rsi_14,
        adr_20,
        volume_avg_20,
        perfect_order_bullish,
        ai_score,
        ai_confidence,
        ai_prediction,
        ai_reasoning,
        investment_decision
      `
      )
      .eq('date', today);

    // テクニカルフィルターを適用
    const { technical, fundamental } = filters;

    if (technical) {
      // RSI フィルター
      if (technical.rsi_14) {
        if (technical.rsi_14.min !== undefined) {
          query = query.gte('rsi_14', technical.rsi_14.min);
        }
        if (technical.rsi_14.max !== undefined) {
          query = query.lte('rsi_14', technical.rsi_14.max);
        }
      }

      // ADR フィルター
      if (technical.adr_20) {
        if (technical.adr_20.min !== undefined) {
          query = query.gte('adr_20', technical.adr_20.min);
        }
        if (technical.adr_20.max !== undefined) {
          query = query.lte('adr_20', technical.adr_20.max);
        }
      }

      // 出来高フィルター (dollar volume)
      if (technical.volume?.dollar_volume_min) {
        query = query.gte('dollar_volume', technical.volume.dollar_volume_min);
      }
    }

    if (fundamental) {
      // 価格範囲フィルター
      if (fundamental.price_range) {
        if (fundamental.price_range.min !== undefined) {
          query = query.gte('current_price', fundamental.price_range.min);
        }
        if (fundamental.price_range.max !== undefined) {
          query = query.lte('current_price', fundamental.price_range.max);
        }
      }

      // 投資判断フィルター
      if (fundamental.investment_decision && fundamental.investment_decision.length > 0) {
        query = query.in('investment_decision', fundamental.investment_decision);
      }
    }

    // AI予測スコアでソート（降順）
    query = query.order('ai_score', { ascending: false });

    // プリセットに応じて件数制限
    const limit = getPresetLimit(preset_id);
    if (limit) {
      query = query.limit(limit);
    }

    // クエリ実行
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'データベースエラー', details: error.message }, { status: 500 });
    }

    // データがない場合
    if (!data || data.length === 0) {
      return NextResponse.json({
        results: [],
        total_count: 0,
        execution_time_ms: Date.now() - startTime,
        message: 'データがまだ取得されていません。初回データ収集は /api/cron/update-stocks を実行してください。',
      });
    }

    // スコア計算（互換性のため）
    const results = data.map(stock => ({
      symbol: stock.symbol,
      name: '', // stock_dataテーブルにはnameがないため、必要に応じてjoinする
      current_price: stock.current_price,
      volume: stock.volume,
      dollar_volume: stock.dollar_volume,
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
      ai_score: stock.ai_score,
      ai_confidence: stock.ai_confidence,
      ai_prediction: stock.ai_prediction,
      ai_reasoning: stock.ai_reasoning,
      investment_decision: stock.investment_decision,
      score: stock.ai_score || 0, // 互換性のため
    }));

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      results,
      total_count: results.length,
      execution_time_ms: executionTime,
    });
  } catch (error: any) {
    console.error('Screening error:', error);
    return NextResponse.json(
      {
        error: 'スクリーニング処理に失敗しました',
        details: error.message || '不明なエラー',
      },
      { status: 500 }
    );
  }
}

/**
 * プリセットIDに応じた件数制限を取得
 */
function getPresetLimit(presetId?: string): number | null {
  if (!presetId) return null;

  // 「ベスト10」系は10件
  if (presetId.includes('best') || presetId.includes('top')) {
    return 10;
  }

  // AI系は30件
  if (presetId.includes('ai_')) {
    return 30;
  }

  // それ以外は制限なし（または100件）
  return 100;
}
