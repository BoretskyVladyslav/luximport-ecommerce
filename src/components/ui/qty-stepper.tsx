"use client";

import { useEffect, useState } from "react";

export function parseTypedQty(raw: string, max: number | null): number | null {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  const qty = Math.trunc(n);
  if (max === null) return qty;
  if (max < 1) return null;
  return Math.min(qty, max);
}

export function QtyStepper({
  id,
  quantity,
  max,
  piecesPerBox,
  onChange,
  disabled,
  live,
}: {
  id: string;
  quantity: number;
  max: number | null;
  piecesPerBox?: number;
  onChange: (qty: number) => void;
  disabled?: boolean;
  live?: boolean;
}) {
  const [draft, setDraft] = useState(String(quantity));
  const inputId = `qty-${id}`;
  const boxQty =
    typeof piecesPerBox === "number" &&
    Number.isFinite(piecesPerBox) &&
    piecesPerBox > 0
      ? Math.trunc(piecesPerBox)
      : null;
  const liveQty = parseTypedQty(draft, max) ?? quantity;
  const canInc = !disabled && (max === null || liveQty < max);
  const canDec = !disabled && liveQty > 1;
  const canAddBox =
    !disabled && boxQty !== null && (max === null || liveQty < max);

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const resolvedQty = () => parseTypedQty(draft, max) ?? quantity;

  const commitDraft = () => {
    if (disabled) {
      setDraft(String(quantity));
      return quantity;
    }
    const next = parseTypedQty(draft, max);
    if (next === null) {
      setDraft(String(quantity));
      return quantity;
    }
    if (next !== quantity) onChange(next);
    else setDraft(String(quantity));
    return next;
  };

  const addBox = () => {
    if (disabled || boxQty === null) return;
    const base = resolvedQty();
    const uncapped = base + boxQty;
    const next = max !== null ? Math.min(uncapped, max) : uncapped;
    if (next > base) onChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-stretch overflow-hidden rounded-md border-2 border-stone-900">
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] font-body text-lg text-stone-900 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          onClick={() => {
            const next = resolvedQty() - 1;
            if (next < 1) return;
            onChange(next);
          }}
          aria-label="Зменшити кількість"
          disabled={!canDec}
        >
          −
        </button>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label="Кількість"
          value={draft}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d+$/.test(v)) {
              setDraft(v);
              if (live) {
                const parsed = parseTypedQty(v, max);
                if (parsed !== null && parsed !== quantity) onChange(parsed);
              }
            }
          }}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="min-h-[44px] w-12 min-w-[2.75rem] border-x-2 border-stone-900 bg-white text-center font-body text-sm font-bold lining-nums tabular-nums text-stone-900 outline-none disabled:cursor-not-allowed disabled:opacity-40"
        />
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] font-body text-lg text-stone-900 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          onClick={() => {
            const next = resolvedQty() + 1;
            if (max !== null && next > max) return;
            onChange(next);
          }}
          aria-label="Збільшити кількість"
          disabled={!canInc}
        >
          +
        </button>
      </div>
      {boxQty !== null && (
        <button
          type="button"
          className="min-h-[44px] rounded-md border-2 border-stone-900 px-3 font-body text-[0.65rem] font-semibold uppercase tracking-wide text-stone-900 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          onClick={addBox}
          disabled={!canAddBox}
          aria-label={`Додати ящик, ${boxQty} шт.`}
        >
          + 1 ящик
        </button>
      )}
    </div>
  );
}
