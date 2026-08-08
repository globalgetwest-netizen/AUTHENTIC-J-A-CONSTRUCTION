import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccessLevel, DocumentStatus, Prisma } from '@ajac/database';
import type { AuthUser } from '../common/auth/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { buildOrderBy, paginate, prismaSkipTake } from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { uploadsUrl } from '../common/storage/uploads';
import type {
  AddDocumentVersionDto,
  CreateDocumentDto,
  GrantDocumentAccessDto,
  QueryDocumentsDto,
  UpdateDocumentStatusDto,
} from './dto/documents.dto';

const LIST_INCLUDE = { _count: { select: { versions: true } } } as const satisfies Prisma.DocumentInclude;

const DETAIL_INCLUDE = {
  versions: { orderBy: { version: 'asc' } },
  access: { orderBy: { grantedAt: 'desc' } },
} as const satisfies Prisma.DocumentInclude;

/** A document that also carries the uploader's display name. */
export type DocumentListRow = Prisma.DocumentGetPayload<{ include: typeof LIST_INCLUDE }> & {
  uploaderName: string | null;
};

export type DocumentDetailRow = Prisma.DocumentGetPayload<{ include: typeof DETAIL_INCLUDE }> & {
  uploaderName: string | null;
};

/**
 * Self-hosted document library. Documents carry a current file (or link) plus
 * a version history; access is scoped to specific principals via
 * `DocumentAccess`, and visibility graded via `accessLevel` / `status`.
 * Like projects' author resolution, uploader names have no Prisma FK relation
 * (only `uploadedById`), so they're resolved through a User lookup.
 */
@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Reads ---------------------------------------------------------------

  async list(query: QueryDocumentsDto): Promise<Paginated<DocumentListRow>> {
    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, ['createdAt'] as const);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        orderBy,
        ...prismaSkipTake(query),
        include: LIST_INCLUDE,
      }),
      this.prisma.document.count({ where }),
    ]);
    const names = await this.resolveUploaderNames(data.map((d) => d.uploadedById));
    const rows = data.map((doc) => ({ ...doc, uploaderName: names.get(doc.uploadedById) ?? null }));
    return paginate(rows, total, query);
  }

  async get(id: string): Promise<DocumentDetailRow> {
    const doc = await this.findLive(id);
    if (!doc) throw new NotFoundException('Document not found');
    const names = await this.resolveUploaderNames([doc.uploadedById]);
    return { ...doc, uploaderName: names.get(doc.uploadedById) ?? null };
  }

  // --- Writes --------------------------------------------------------------

  async create(dto: CreateDocumentDto, user: AuthUser, file?: Express.Multer.File, url?: string) {
    const location = resolveFile(file, url ?? dto.url);
    if (!location) {
      throw new BadRequestException('Provide an uploaded file or a URL for the document');
    }
    const doc = await this.prisma.document.create({
      data: {
        title: dto.title,
        category: dto.category,
        entity: dto.entity,
        entityId: dto.entityId,
        accessLevel: dto.accessLevel ?? AccessLevel.INTERNAL,
        status: DocumentStatus.DRAFT,
        uploadedById: user.id,
        ...location,
        versions: {
          create: { version: 1, ...location, uploadedById: user.id },
        },
      },
      include: LIST_INCLUDE,
    });
    const names = await this.resolveUploaderNames([doc.uploadedById]);
    return { ...doc, uploaderName: names.get(doc.uploadedById) ?? null };
  }

  async addVersion(
    id: string,
    dto: AddDocumentVersionDto,
    user: AuthUser,
    file?: Express.Multer.File,
    url?: string,
  ): Promise<DocumentDetailRow> {
    const doc = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const location = resolveFile(file, url ?? dto.url);
    if (!location) throw new BadRequestException('Provide an uploaded file or a URL');

    const next = (doc.versions[0]?.version ?? 0) + 1;
    await this.prisma.$transaction([
      this.prisma.document.update({ where: { id }, data: { ...location, updatedAt: new Date() } }),
      this.prisma.documentVersion.create({
        data: {
          documentId: id,
          version: next,
          ...location,
          uploadedById: user.id,
          note: dto.note,
        },
      }),
    ]);
    return this.get(id);
  }

  async updateStatus(id: string, dto: UpdateDocumentStatusDto): Promise<DocumentDetailRow> {
    const doc = await this.findLive(id);
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.update({
      where: { id },
      data: { status: dto.status as DocumentStatus },
    });
    return this.get(id);
  }

  async grantAccess(id: string, dto: GrantDocumentAccessDto, user: AuthUser) {
    const doc = await this.findLive(id);
    if (!doc) throw new NotFoundException('Document not found');
    return this.prisma.documentAccess.upsert({
      where: {
        documentId_principalType_principalId: {
          documentId: id,
          principalType: dto.principalType,
          principalId: dto.principalId,
        },
      },
      update: { permission: dto.permission ?? 'VIEW', grantedById: user.id },
      create: {
        documentId: id,
        principalType: dto.principalType,
        principalId: dto.principalId,
        permission: dto.permission ?? 'VIEW',
        grantedById: user.id,
      },
    });
  }

  async revokeAccess(id: string, principalType: string, principalId: string) {
    const doc = await this.findLive(id);
    if (!doc) throw new NotFoundException('Document not found');
    const res = await this.prisma.documentAccess.deleteMany({
      where: { documentId: id, principalType, principalId },
    });
    return { revoked: res.count };
  }

  /** Soft-deletes the document (kept for a future recycle-bin). */
  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.prisma.document.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (res.count === 0) throw new NotFoundException('Document not found');
    return { deleted: true };
  }

  // --- Internals -----------------------------------------------------------

  private async findLive(id: string) {
    return this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: DETAIL_INCLUDE,
    });
  }

  /** Resolves uploadedById → "First Last" display name (no FK relation exists). */
  private async resolveUploaderNames(ids: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return new Map();
    const users = await this.prisma.user.findMany({
      where: { id: { in: unique } },
      select: { id: true, firstName: true, lastName: true },
    });
    return new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]));
  }
}

function resolveFile(
  file: Express.Multer.File | undefined,
  url: string | undefined,
): { fileUrl: string; fileType: string | null; sizeBytes: number | null } | null {
  if (file) {
    return {
      fileUrl: uploadsUrl('documents', file.filename),
      fileType: file.mimetype,
      sizeBytes: file.size,
    };
  }
  if (url) {
    return { fileUrl: url, fileType: null, sizeBytes: null };
  }
  return null;
}