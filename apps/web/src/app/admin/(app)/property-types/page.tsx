"use client";

import { OrgPanel } from "@/components/admin/OrgPanel";
import type { PropertyType } from "@/lib/admin/types";

export default function PropertyTypesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Property types</h1>
        <p className="text-sm text-neutral-500">
          Categories used by the real estate / properties module.
        </p>
      </div>
      <OrgPanel<PropertyType>
        title="Property types"
        api="/api/admin/property-types"
        primaryLabel="Name"
        extraLabel="Description"
        toPrimary={(r) => r.name}
        toExtra={(r) => r.description ?? ""}
        toCount={(r) => r._count?.properties ?? 0}
        buildBody={(name, description) => ({ name, description: description || null })}
      />
    </div>
  );
}
