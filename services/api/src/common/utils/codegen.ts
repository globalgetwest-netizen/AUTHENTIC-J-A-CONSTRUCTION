/**
 * Server-side business-code generator for unique keys such as client codes,
 * project codes or lead numbers. Keeps client-supplied data free of
 * uniqueness collisions and gives records human-readable references.
 */
export function generateBusinessCode(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${date}-${rand}`;
}
