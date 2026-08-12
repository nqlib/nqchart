"use client";

/**
 * Shared ReferenceLine / ReferenceBand registrars + controlled Legend helper.
 */

import { usePartId, useRegisterPart } from "./part-registry";
import type { ReferenceTone } from "./reference-marks";
import { NQChartLegend, type ChartLegendVariant } from "@/registry/ui/legend";
import { useState } from "react";

export type { ReferenceTone };

export function ReferenceLine({
  y,
  x,
  yAxisId,
  label,
  labelPosition = "end",
  variant = "dashed",
  tone = "neutral",
}: {
  y?: number;
  x?: string | number;
  yAxisId?: string;
  label?: string;
  labelPosition?: "start" | "middle" | "end";
  variant?: "solid" | "dashed" | "dotted";
  tone?: ReferenceTone;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "referenceLine",
    id,
    y,
    x,
    yAxisId,
    label,
    labelPosition,
    variant,
    tone,
  });
  return null;
}

export function ReferenceBand({
  y,
  x,
  yAxisId,
  label,
  tone = "neutral",
  opacity,
}: {
  y?: [number, number];
  x?: [string | number, string | number];
  yAxisId?: string;
  label?: string;
  tone?: ReferenceTone;
  opacity?: number;
}) {
  const id = usePartId();
  useRegisterPart({
    type: "referenceBand",
    id,
    y,
    x,
    yAxisId,
    label,
    tone,
    opacity,
  });
  return null;
}

export function ControlledChartLegend({
  variant = "rounded-square",
  align = "right",
  isClickable = false,
  hideIcon,
  className,
  selected: selectedProp,
  onSelectChange,
}: {
  variant?: ChartLegendVariant;
  align?: "left" | "center" | "right";
  isClickable?: boolean;
  hideIcon?: boolean;
  className?: string;
  selected?: string | null;
  onSelectChange?: (selected: string | null) => void;
}) {
  const id = usePartId();
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const controlled = selectedProp !== undefined;
  const selected = controlled ? (selectedProp ?? null) : uncontrolled;
  // Registered after `selected` resolves: the part is what carries the
  // selection to the compiler, so it has to hold the current value.
  useRegisterPart({ type: "legend", id, variant, align, isClickable, selected });
  const setSelected = onSelectChange ?? setUncontrolled;

  return (
    <NQChartLegend
      variant={variant}
      align={align}
      hideIcon={hideIcon}
      isClickable={isClickable}
      className={className}
      selected={selected}
      onSelectChange={setSelected}
    />
  );
}
