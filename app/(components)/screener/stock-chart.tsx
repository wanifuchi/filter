"use client";

import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HistoricalDataPoint {
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

interface StockChartProps {
  historicalData: HistoricalDataPoint[];
  symbol: string;
}

export function StockChart({ historicalData, symbol }: StockChartProps) {
  if (!historicalData || historicalData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>チャートデータなし</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">表示できるチャートデータがありません</p>
        </CardContent>
      </Card>
    );
  }

  // データを日付順にソート
  const sortedData = [...historicalData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 日付フォーマット
  const formattedData = sortedData.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="space-y-6">
      {/* 価格チャート */}
      <Card>
        <CardHeader>
          <CardTitle>{symbol} - 価格チャート</CardTitle>
          <CardDescription>終値と移動平均線（直近90日）</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#2563eb"
                strokeWidth={2}
                name="終値"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ma_10"
                stroke="#16a34a"
                strokeWidth={1.5}
                name="MA10"
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="ma_20"
                stroke="#ea580c"
                strokeWidth={1.5}
                name="MA20"
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="ma_50"
                stroke="#9333ea"
                strokeWidth={1.5}
                name="MA50"
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="ma_200"
                stroke="#dc2626"
                strokeWidth={2}
                name="MA200"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 出来高チャート */}
      <Card>
        <CardHeader>
          <CardTitle>出来高</CardTitle>
          <CardDescription>日次取引量</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  }
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}K`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip
                formatter={(value: any) => [
                  Number(value).toLocaleString(),
                  '出来高',
                ]}
                labelStyle={{ color: '#000' }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
