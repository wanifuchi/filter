"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PRESET_STRATEGIES, PresetStrategy } from "@/lib/definitions";

interface PresetSelectorProps {
  onSelectPreset: (preset: PresetStrategy) => void;
}

export function PresetSelector({ onSelectPreset }: PresetSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">プリセット戦略</h3>
      <div className="space-y-2">
        {PRESET_STRATEGIES.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={() => onSelectPreset(preset)}
          >
            <div>
              <div className="font-semibold">{preset.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {preset.description}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
