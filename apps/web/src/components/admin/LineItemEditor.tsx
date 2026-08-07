"use client";

export interface LineItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";

export function LineItemEditor({
  items,
  onChange,
}: {
  items: LineItemDraft[];
  onChange: (items: LineItemDraft[]) => void;
}) {
  function update(index: number, patch: Partial<LineItemDraft>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function add() {
    onChange([...items, { description: "", quantity: "1", unitPrice: "" }]);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_72px_110px_32px] items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        <div>Description</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Unit price (GHS)</div>
        <div />
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-3 py-6 text-center text-sm text-neutral-500">
          No line items yet.
        </p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_72px_110px_32px] items-center gap-2">
            <input
              className={inputClass}
              value={item.description}
              placeholder="Description of works or materials"
              onChange={(e) => update(i, { description: e.target.value })}
            />
            <input
              className={`${inputClass} text-right`}
              value={item.quantity}
              inputMode="decimal"
              onChange={(e) => update(i, { quantity: e.target.value })}
            />
            <input
              className={`${inputClass} text-right`}
              value={item.unitPrice}
              inputMode="decimal"
              placeholder="0.00"
              onChange={(e) => update(i, { unitPrice: e.target.value })}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove line item ${i + 1}`}
              className="rounded-md p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
            >
              ×
            </button>
          </div>
        ))
      )}

      <button type="button" onClick={add} className="text-sm font-semibold text-brand-blue hover:underline">
        + Add line item
      </button>
    </div>
  );
}
