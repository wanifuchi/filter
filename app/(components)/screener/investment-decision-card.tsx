"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Minus, TrendingDown } from "lucide-react";
import { InvestmentDecision } from "@/lib/definitions";

interface InvestmentDecisionCardProps {
  decision: InvestmentDecision;
  symbol: string;
}

export function InvestmentDecisionCard({ decision, symbol }: InvestmentDecisionCardProps) {
  const { action, confidence, reasons } = decision;

  // アクションに応じた設定
  const config = {
    BUY: {
      bgColor: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      badgeColor: "bg-green-100 text-green-800",
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      label: "買い（BUY）",
      description: "テクニカル分析に基づく買いシグナルです",
    },
    HOLD: {
      bgColor: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-700",
      badgeColor: "bg-yellow-100 text-yellow-800",
      icon: <Minus className="h-8 w-8 text-yellow-600" />,
      label: "保持（HOLD）",
      description: "様子見を推奨します",
    },
    SELL: {
      bgColor: "bg-red-50 border-red-200",
      textColor: "text-red-700",
      badgeColor: "bg-red-100 text-red-800",
      icon: <TrendingDown className="h-8 w-8 text-red-600" />,
      label: "売り（SELL）",
      description: "テクニカル分析に基づく売りシグナルです",
    },
  };

  const currentConfig = config[action];

  return (
    <Card className={`${currentConfig.bgColor} border-2`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {currentConfig.icon}
            <div>
              <CardTitle className={`text-2xl ${currentConfig.textColor}`}>
                投資判断: {currentConfig.label}
              </CardTitle>
              <CardDescription className="mt-1">
                {currentConfig.description}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-4 py-2 rounded-full ${currentConfig.badgeColor} font-semibold`}>
              判断スコア: {confidence}点
            </div>
            <p className="text-xs text-gray-600 mt-1">
              この判断の根拠となるスコア
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h4 className={`font-semibold ${currentConfig.textColor} text-lg`}>判断理由:</h4>
          <ul className="space-y-2">
            {reasons.map((reason, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <span className="mt-0.5">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            ⚠️ この判断はテクニカル分析に基づいた参考情報です。投資判断は自己責任で行ってください。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
