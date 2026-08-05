import { Prisma } from '@ajac/database';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditMeta {
  actorId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Writes an audit log entry. Failures are swallowed so auditing never breaks a flow. */
export async function recordAudit(
  prisma: PrismaService,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Prisma.InputJsonValue,
  meta: AuditMeta = {},
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        metadata: metadata ?? undefined,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        actorId: meta.actorId ?? null,
      },
    });
  } catch {
    // Intentionally ignored.
  }
}
