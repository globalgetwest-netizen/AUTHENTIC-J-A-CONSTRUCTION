"use client";

import { OrgPanel } from "@/components/admin/OrgPanel";
import type { MaterialCategory } from "@/lib/admin/types";

export default function MaterialCategoriesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Material categories</h1>
        <p className="text-sm text-neutral-500">
          Groups used when cataloguing materials (cement, aggregates, steel…).
        </p>
      </div>
      <OrgPanel<MaterialCategory>
        title="Material categories"
        api="/api/admin/material-categories"
        primaryLabel="Category name"
        extraLabel="Description"
        toPrimary={(r) => r.name}
        toExtra={(r) => r.description ?? ""}
        toCount={(r) => r._count?.materials ?? 0}
        buildBody={(name, description) => ({ name, description: description || null })}
      />
    </div>
  );
}
