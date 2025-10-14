"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StockWithIndicators } from "@/lib/definitions";

interface StockDataTableProps {
  stocks: StockWithIndicators[];
  onSelectStock?: (stock: StockWithIndicators) => void;
  onSymbolClick?: (symbol: string) => void;
}

export function StockDataTable({ stocks, onSelectStock, onSymbolClick }: StockDataTableProps) {
  if (stocks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>スクリーニング結果がありません</p>
        <p className="text-sm mt-2">フィルター条件を変更してください</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableCaption>
          {stocks.length}件の銘柄が見つかりました
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ティッカー</TableHead>
            <TableHead>銘柄名</TableHead>
            <TableHead>セクター</TableHead>
            <TableHead className="text-right">株価</TableHead>
            <TableHead className="text-right">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help border-b border-dotted">時価総額</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>企業の株式市場での評価額</p>
                  <p className="text-xs text-muted-foreground mt-1">株価 × 発行済株式数</p>
                </TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="text-right">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help border-b border-dotted">ADR(20)</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>平均的な1日の値動きの幅（20日平均）</p>
                  <p className="text-xs text-muted-foreground mt-1">高い値ほど短期的な利益機会が大きい</p>
                </TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="text-right">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help border-b border-dotted">RSI</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>買われすぎ・売られすぎを示す指標（0-100）</p>
                  <p className="text-xs text-muted-foreground mt-1">30以下: 売られすぎ / 70以上: 買われすぎ</p>
                </TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="text-right">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help border-b border-dotted">総合評価スコア</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">銘柄の総合的な魅力度（0-100点）</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    200MA・パーフェクトオーダー・RSI・ADR・出来高を<br />
                    総合的に評価したスコア。スクリーニング結果の並び替えに使用
                  </p>
                  <p className="text-xs text-yellow-600 mt-2">
                    ※ 買いシグナル強度とは別の指標です
                  </p>
                </TooltipContent>
              </Tooltip>
            </TableHead>
          </TableRow>
        </TableHeader>
      <TableBody>
        {stocks.map((stock) => (
          <TableRow
            key={stock.symbol}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelectStock?.(stock)}
          >
            <TableCell
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onSymbolClick?.(stock.symbol);
              }}
            >
              {stock.symbol}
            </TableCell>
            <TableCell className="max-w-[200px] truncate">{stock.name}</TableCell>
            <TableCell>{stock.sector}</TableCell>
            <TableCell className="text-right">
              ${stock.current_price.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              {formatMarketCap(stock.market_cap)}
            </TableCell>
            <TableCell className="text-right">
              {stock.technical_indicators.adr_20?.toFixed(2) ?? '-'}%
            </TableCell>
            <TableCell className="text-right">
              {stock.technical_indicators.rsi_14?.toFixed(0) ?? '-'}
            </TableCell>
            <TableCell className="text-right">
              <span className={`font-semibold ${getScoreColor(stock.score)}`}>
                {stock.score}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>
    </TooltipProvider>
  );
}

function formatMarketCap(marketCap: number | null): string {
  if (marketCap === null || marketCap === undefined) {
    return 'N/A';
  }
  if (marketCap >= 1_000_000_000_000) {
    return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  } else if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  } else if (marketCap >= 1_000_000) {
    return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  }
  return `$${marketCap.toLocaleString()}`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-gray-600 dark:text-gray-400";
}
