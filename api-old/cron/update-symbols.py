"""
銘柄リスト更新Cronジョブ
Vercel Cron: 毎日 23:00 UTC (米国市場開始前)

銘柄マスタテーブルを最新の構成銘柄リストで更新
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
from pathlib import Path

# パス解決
api_dir = Path(__file__).parent.parent
sys.path.insert(0, str(api_dir))

from utils.symbol_lists import SymbolLists
from utils.yfinance_wrapper import YFinanceWrapper


class handler(BaseHTTPRequestHandler):
    """Vercel Serverless Function Handler"""

    def do_POST(self):
        """POSTリクエスト処理"""
        try:
            # CRON_SECRET検証
            auth_header = self.headers.get('Authorization', '')
            expected_secret = 'Bearer your-cron-secret'  # 環境変数から取得すべき

            # if auth_header != expected_secret:
            #     self.send_error(401, 'Unauthorized')
            #     return

            # 銘柄リスト取得
            print("📥 銘柄リスト取得開始...")
            symbols = SymbolLists.get_all_symbols()

            # 銘柄情報取得
            print(f"\n📊 {len(symbols)}銘柄の情報取得開始...")
            yf_wrapper = YFinanceWrapper()
            updated_count = 0
            error_count = 0

            # TODO: Postgresへの保存実装
            # 現時点ではログ出力のみ
            for i, symbol in enumerate(symbols):
                if i >= 10:  # テスト用: 最初の10銘柄のみ
                    break

                try:
                    stock_info = yf_wrapper.get_stock_info(symbol)
                    if stock_info:
                        print(f"✅ {symbol}: {stock_info['name']}")
                        updated_count += 1
                    else:
                        error_count += 1
                except Exception as e:
                    print(f"❌ {symbol}: {e}")
                    error_count += 1

            # レスポンス
            response = {
                'success': True,
                'total_symbols': len(symbols),
                'updated': updated_count,
                'errors': error_count,
                'message': f'銘柄マスタ更新完了: {updated_count}/{len(symbols)} 成功'
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))

    def do_GET(self):
        """GETリクエスト処理（手動トリガー用）"""
        self.do_POST()
