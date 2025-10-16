import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // 5分のタイムアウト（Vercel Pro以上で必要）

/**
 * 全銘柄バッチ処理APIエンドポイント
 *
 * GitHub Actionsから毎日呼び出されて、全銘柄のデータを更新します。
 *
 * セキュリティ:
 * - CRON_SECRET による認証
 * - Supabase Service Role Key による書き込み権限
 *
 * 処理フロー:
 * 1. Supabaseから is_active=true の全銘柄を取得
 * 2. 各銘柄を18秒間隔で /api/process-stock に送信
 * 3. batch_jobs テーブルに進捗を記録
 * 4. 完了/エラー状況を返す
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // CRON_SECRET 認証チェック
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[BATCH-ALL] CRON_SECRET が設定されていません');
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[BATCH-ALL] 認証失敗');
      return NextResponse.json(
        { error: '認証エラー' },
        { status: 401 }
      );
    }

    // Supabase クライアント初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // アクティブな全銘柄を取得
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('symbol, name')
      .eq('is_active', true)
      .order('symbol');

    if (stocksError) {
      console.error('[BATCH-ALL] 銘柄取得エラー:', stocksError);
      return NextResponse.json(
        { error: '銘柄リスト取得失敗', details: stocksError.message },
        { status: 500 }
      );
    }

    if (!stocks || stocks.length === 0) {
      console.warn('[BATCH-ALL] アクティブな銘柄が見つかりません');
      return NextResponse.json({
        message: 'アクティブな銘柄が見つかりません',
        processed: 0,
        total: 0,
      });
    }

    console.log(`[BATCH-ALL] 処理対象: ${stocks.length}銘柄`);

    // バッチジョブ開始をDBに記録
    const { data: jobData, error: jobError } = await supabase
      .from('batch_jobs')
      .insert({
        job_name: 'Daily Stock Data Batch',
        batch_number: 1,
        start_index: 0,
        end_index: stocks.length - 1,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('[BATCH-ALL] バッチジョブ記録エラー:', jobError);
      return NextResponse.json(
        { error: 'バッチジョブ記録失敗', details: jobError.message },
        { status: 500 }
      );
    }

    const jobId = jobData.id;
    console.log(`[BATCH-ALL] バッチジョブ開始: Job ID ${jobId}`);

    // 処理結果を記録
    const results = {
      total: stocks.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ symbol: string; error: string }>,
    };

    // 各銘柄を処理（18秒間隔）
    const INTERVAL_MS = 18000; // 18秒
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3001';

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      console.log(`[BATCH-ALL] 処理中 (${i + 1}/${stocks.length}): ${stock.symbol}`);

      try {
        const response = await fetch(`${baseUrl}/api/process-stock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cronSecret}`,
          },
          body: JSON.stringify({ symbol: stock.symbol }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        results.succeeded++;
        console.log(`[BATCH-ALL] 成功: ${stock.symbol}`);
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ symbol: stock.symbol, error: errorMessage });
        console.error(`[BATCH-ALL] 失敗: ${stock.symbol} - ${errorMessage}`);

        // エラーログをDBに記録
        await supabase.from('error_logs').insert({
          job_id: jobId,
          symbol: stock.symbol,
          error_type: 'processing_error',
          error_message: errorMessage,
          created_at: new Date().toISOString(),
        });
      }

      results.processed++;

      // 進捗をDBに更新
      await updateJobProgress(supabase, jobId, results.processed, results.total);

      // 次の銘柄まで待機（最後の銘柄は待機不要）
      if (i < stocks.length - 1) {
        await sleep(INTERVAL_MS);
      }
    }

    // バッチジョブ完了をDBに記録
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const status = results.failed > 0 ? 'completed_with_errors' : 'completed';

    await updateJobStatus(
      supabase,
      jobId,
      status,
      results.succeeded,
      results.failed
    );

    console.log(`[BATCH-ALL] 完了: 成功 ${results.succeeded}/${results.total}, 失敗 ${results.failed}`);

    return NextResponse.json({
      message: 'バッチ処理完了',
      job_id: jobId,
      duration_seconds: duration,
      results: {
        total: results.total,
        processed: results.processed,
        succeeded: results.succeeded,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // 最初の10件のエラーのみ返す
      },
    });

  } catch (error) {
    console.error('[BATCH-ALL] 致命的エラー:', error);
    return NextResponse.json(
      {
        error: 'バッチ処理失敗',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * バッチジョブのステータスを更新
 */
async function updateJobStatus(
  supabase: any,
  jobId: number,
  status: string,
  successCount: number,
  errorCount: number
) {
  const { error } = await supabase
    .from('batch_jobs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      success_count: successCount,
      error_count: errorCount,
    })
    .eq('id', jobId);

  if (error) {
    console.error('[BATCH-ALL] ジョブステータス更新エラー:', error);
  }
}

/**
 * バッチジョブの進捗を更新
 */
async function updateJobProgress(
  supabase: any,
  jobId: number,
  processed: number,
  total: number
) {
  const { error } = await supabase
    .from('batch_jobs')
    .update({
      processed_count: processed,
    })
    .eq('id', jobId);

  if (error) {
    console.error('[BATCH-ALL] 進捗更新エラー:', error);
  }
}

/**
 * 指定ミリ秒待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
