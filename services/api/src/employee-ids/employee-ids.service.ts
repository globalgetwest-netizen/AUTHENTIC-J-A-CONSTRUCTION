import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeIdType, VerificationResult, Prisma } from '@ajac/database';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import type { Readable } from 'node:stream';
import { PrismaService } from '../prisma/prisma.service';
import { contentTypeFromFile, resolveStoredFile, uploadsUrl } from '../common/storage/uploads';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateEmployeeIdDto, UpdateEmployeeIdDto } from './dto/create-employee-id.dto';
import { QueryEmployeeIdsDto } from './dto/employee-id-query.dto';
import { VerifyEmployeeIdDto } from './dto/verify-employee-id.dto';

const SORTABLE = ['cardNumber', 'issuedAt', 'expiresAt', 'status', 'createdAt'] as const;

const EMPLOYEE_SELECT = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  department: { select: { name: true } },
  position: { select: { title: true } },
  branch: { select: { name: true } },
} as const;

const CARD_INCLUDE = {
  employee: { select: EMPLOYEE_SELECT },
} as const;

/** Constant-time comparison of two strings (guards against timing attacks). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

@Injectable()
export class EmployeeIdsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Issue an ID card. The card can be linked to an existing employee
   * (`employeeId`) or created standalone from the holder fields on the DTO.
   * If the employee already holds a live (non-REVOKED) card, it is revoked and
   * the new one linked via `replacedById`.
   */
  async issue(dto: CreateEmployeeIdDto): Promise<object> {
    const idType = dto.idType ?? EmployeeIdType.STAFF;
    let employeeId: string | undefined = dto.employeeId;

    if (employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: employeeId, deletedAt: null },
      });
      if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    const active = employeeId
      ? await this.prisma.employeeID.findFirst({
          where: { employeeId, status: { not: VerificationResult.REVOKED } },
        })
      : null;

    const cardNumber = generateBusinessCode('EID');
    const qrToken = randomBytes(24).toString('hex');

    return this.prisma.$transaction(async (tx) => {
      if (active) {
        await tx.employeeID.update({
          where: { id: active.id },
          data: { status: VerificationResult.REVOKED },
        });
      }
      return tx.employeeID.create({
        data: {
          employeeId: employeeId ?? null,
          cardNumber,
          qrToken,
          status: VerificationResult.VERIFIED,
          idType,
          holderName: dto.holderName ?? null,
          position: dto.position ?? null,
          department: dto.department ?? null,
          contactPhone: dto.contactPhone ?? null,
          contactEmail: dto.contactEmail ?? null,
          photoUrl: dto.photoUrl ?? null,
          issuedAt: new Date(),
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          ...(active ? { replacedById: active.id } : {}),
        },
        include: CARD_INCLUDE,
      });
    });
  }

  /** Patch an existing card's type, holder details or expiry. */
  async update(id: string, dto: UpdateEmployeeIdDto): Promise<object> {
    const card = await this.prisma.employeeID.findFirst({ where: { id } });
    if (!card) throw new NotFoundException(`Employee ID ${id} not found`);
    return this.prisma.employeeID.update({
      where: { id },
      data: {
        ...(dto.idType !== undefined ? { idType: dto.idType } : {}),
        ...(dto.holderName !== undefined ? { holderName: dto.holderName } : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
        ...(dto.department !== undefined ? { department: dto.department } : {}),
        ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
        ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
      },
      include: CARD_INCLUDE,
    });
  }

  /**
   * Reissue a card: revoke the current one and issue a fresh card carrying the
   * same holder details and ID type (new card number + QR token). Used to
   * replace a lost, damaged or expired card while keeping the lineage.
   */
  async reissue(id: string, expiresAt?: string): Promise<object> {
    const current = await this.prisma.employeeID.findFirst({
      where: { id },
      include: { employee: { select: { id: true } } },
    });
    if (!current) throw new NotFoundException(`Employee ID ${id} not found`);

    const cardNumber = generateBusinessCode('EID');
    const qrToken = randomBytes(24).toString('hex');

    return this.prisma.$transaction(async (tx) => {
      await tx.employeeID.update({
        where: { id: current.id },
        data: { status: VerificationResult.REVOKED },
      });
      return tx.employeeID.create({
        data: {
          employeeId: current.employeeId ?? null,
          cardNumber,
          qrToken,
          status: VerificationResult.VERIFIED,
          idType: current.idType,
          holderName: current.holderName,
          position: current.position,
          department: current.department,
          contactPhone: current.contactPhone,
          contactEmail: current.contactEmail,
          photoUrl: current.photoUrl,
          issuedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : current.expiresAt,
          replacedById: current.id,
        },
        include: CARD_INCLUDE,
      });
    });
  }

  /** Stores an uploaded headshot and returns its `/uploads/...` URL. */
  async uploadPhoto(file?: Express.Multer.File): Promise<{ photoUrl: string }> {
    if (!file) throw new NotFoundException('No photo file was uploaded');
    const photoUrl = uploadsUrl('employees', file.filename);
    return { photoUrl };
  }

  async revoke(id: string): Promise<object> {
    const card = await this.prisma.employeeID.findFirst({ where: { id } });
    if (!card) throw new NotFoundException(`Employee ID ${id} not found`);
    if (card.status === VerificationResult.REVOKED) return card;
    return this.prisma.employeeID.update({
      where: { id },
      data: { status: VerificationResult.REVOKED },
    });
  }

  async list(query: QueryEmployeeIdsDto): Promise<Paginated<object>> {
    const where: Prisma.EmployeeIDWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.search) {
      where.OR = [
        { cardNumber: { contains: query.search, mode: 'insensitive' } },
        { employee: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { employee: { employeeCode: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.employeeID.findMany({ where, skip, take, orderBy, include: CARD_INCLUDE }),
      this.prisma.employeeID.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async get(id: string): Promise<object> {
    const card = await this.prisma.employeeID.findFirst({
      where: { id },
      include: {
        employee: { select: EMPLOYEE_SELECT },
        verifications: { orderBy: { verifiedAt: 'desc' }, take: 20 },
      },
    });
    if (!card) throw new NotFoundException(`Employee ID ${id} not found`);
    return card;
  }

  /** The logged-in staff member's own latest card (for self-service + PDF). */
  async myCard(userId: string): Promise<object | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) return null;
    return this.prisma.employeeID.findFirst({
      where: { employeeId: employee.id },
      orderBy: { issuedAt: 'desc' },
      include: { employee: { select: EMPLOYEE_SELECT } },
    });
  }

  /** The logged-in staff member's own headshot (for the self-service card PDF). */
  async myPhoto(
    userId: string,
  ): Promise<{ stream: Readable; length: number; type: string; filename: string }> {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, photoUrl: true, employeeCode: true },
    });
    if (!employee) throw new NotFoundException('No employee profile is linked to this account');
    if (!employee.photoUrl) throw new NotFoundException('This employee has no photo yet');
    return this.streamStoredPhoto(employee.photoUrl, employee.employeeCode);
  }

  /**
   * Headshot for the public QR-verify page. Gated exactly like `verify`: only a
   * card number with the correct embedded token can stream the photo, so the
   * face is visible to a guard scanning the card without opening a general
   * public directory of worker photos. A standalone card (no linked employee)
   * uses the photo uploaded with the card.
   */
  async openPhotoForVerification(
    card: string,
    token?: string,
  ): Promise<{ stream: Readable; length: number; type: string; filename: string }> {
    const record = await this.prisma.employeeID.findFirst({
      where: { cardNumber: card },
      include: { employee: { select: { photoUrl: true, employeeCode: true } } },
    });
    if (!record || !record.qrToken || !token || !safeEqual(token, record.qrToken)) {
      throw new NotFoundException('No matching card');
    }
    const photoUrl = record.photoUrl ?? record.employee?.photoUrl;
    if (!photoUrl) throw new NotFoundException('This employee has no photo yet');
    const code = record.cardNumber || record.employee?.employeeCode || 'card';
    return this.streamStoredPhoto(photoUrl, code);
  }

  private streamStoredPhoto(
    photoUrl: string,
    employeeCode: string,
  ): { stream: Readable; length: number; type: string; filename: string } {
    const abs = resolveStoredFile(photoUrl);
    if (!existsSync(abs)) throw new NotFoundException('Photo file is missing on disk');
    const stats = statSync(abs);
    return {
      stream: createReadStream(abs),
      length: stats.size,
      type: contentTypeFromFile(abs),
      filename: `photo-${employeeCode}${extname(abs)}`,
    };
  }

  /**
   * Public QR verification: resolve the card by its number, compare the embedded
   * token, and derive a result. Every scan is logged with its outcome.
   */
  async verify(dto: VerifyEmployeeIdDto, ip?: string): Promise<object> {
    const card = await this.prisma.employeeID.findFirst({
      where: { cardNumber: dto.card },
      include: { employee: { select: EMPLOYEE_SELECT } },
    });

    let result: VerificationResult;
    if (!card || !card.qrToken || !safeEqual(dto.t, card.qrToken)) {
      result = VerificationResult.INVALID;
    } else if (card.status === VerificationResult.REVOKED) {
      result = VerificationResult.REVOKED;
    } else if (card.expiresAt && card.expiresAt.getTime() < Date.now()) {
      result = VerificationResult.EXPIRED;
    } else {
      result = VerificationResult.VERIFIED;
    }

    // Persist the scan only when the referenced card exists and has an employeeId —
    // both are required foreign keys in EmployeeIDVerification, so a standalone
    // card (no linked employee) cannot create a verification record.
    if (card && card.employeeId) {
      await this.prisma.employeeIDVerification.create({
        data: {
          employeeId: card.employeeId,
          cardNumber: card.cardNumber,
          result,
          method: 'QR',
          ipAddress: ip ?? null,
        },
      });
    }

    return {
      cardNumber: card?.cardNumber ?? dto.card,
      result,
      verified: result === VerificationResult.VERIFIED,
      issuedAt: card?.issuedAt ?? null,
      expiresAt: card?.expiresAt ?? null,
      employee: card?.employee
        ? {
            id: card.employee.id,
            employeeCode: card.employee.employeeCode,
            name: [card.employee.firstName, card.employee.lastName].filter(Boolean).join(' '),
            department: card.employee.department?.name ?? null,
            position: card.employee.position?.title ?? null,
            photoUrl: card.employee.photoUrl ?? null,
          }
        : null,
    };
  }
}