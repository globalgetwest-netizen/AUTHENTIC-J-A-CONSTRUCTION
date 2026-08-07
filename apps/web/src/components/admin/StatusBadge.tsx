import { Badge } from "@ajac/ui";
import { label, toneFor } from "../../lib/admin/types";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  return (
    <Badge tone={toneFor(value)} soft>
      {label(value)}
    </Badge>
  );
}