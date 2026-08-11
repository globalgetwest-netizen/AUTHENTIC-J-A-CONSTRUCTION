"use client";

import { OrgChart } from "@/components/admin/OrgChart";
import { OrgPanel } from "@/components/admin/OrgPanel";
import type { CompanyBranch, Department, Position } from "@/lib/admin/types";

export default function OrgStructurePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Org structure</h1>
        <p className="text-sm text-neutral-500">
          The command hierarchy, then the branches, departments and positions used when assigning
          employees.
        </p>
      </div>

      <OrgChart />

      <OrgPanel<CompanyBranch>
        title="Branches"
        api="/api/admin/branches"
        primaryLabel="Branch name"
        extraLabel="Location"
        toPrimary={(b) => b.name}
        toExtra={(b) => b.location ?? ""}
        toCount={(b) => b._count?.employees ?? 0}
        buildBody={(name, location) => ({ name, location: location || null })}
      />

      <OrgPanel<Department>
        title="Departments"
        api="/api/admin/departments"
        primaryLabel="Department name"
        toPrimary={(d) => d.name}
        toCount={(d) => d._count?.employees ?? 0}
        buildBody={(name) => ({ name })}
      />

      <OrgPanel<Position>
        title="Positions"
        api="/api/admin/positions"
        primaryLabel="Position title"
        toPrimary={(p) => p.title}
        toExtra={(p) => (p.level ? `Level ${p.level}` : "")}
        toCount={(p) => p._count?.employees ?? 0}
        buildBody={(title) => ({ title })}
      />
    </div>
  );
}
