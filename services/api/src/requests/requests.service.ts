import { Injectable } from '@nestjs/common';
import type { Lead } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import { generateBusinessCode } from '../common/utils/codegen';
import { SubmitRequestDto } from './dto/submit-request.dto';

export interface RequestReference {
  ok: true;
  reference: string;
}

/**
 * Accepts public website requests and persists each one as a NEW CRM lead
 * (source WEBSITE). The request-specific fields (service type, budget,
 * preferred location, contact method, uploaded-file name, etc.) are stored as
 * structured JSON in `Lead.notes` so the CRM can surface them without a schema
 * migration. Analyst/viewing happens through the normal, permission-protected
 * leads endpoint.
 */
@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: SubmitRequestDto): Promise<RequestReference> {
    const payload = {
      requestType: dto.requestType,
      projectType: dto.projectType ?? null,
      service: dto.service ?? null,
      budgetRange: dto.budgetRange ?? null,
      preferredLocation: dto.preferredLocation ?? null,
      preferredContactMethod: dto.preferredContactMethod ?? null,
      whatsapp: dto.whatsapp ?? null,
      description: dto.description ?? null,
      attachmentName: dto.attachmentName ?? null,
      submittedAt: new Date().toISOString(),
    };

    const lead: Lead = await this.prisma.lead.create({
      data: {
        leadNo: generateBusinessCode('LD'),
        source: 'WEBSITE',
        status: 'NEW',
        name: dto.fullName,
        company: dto.company ?? null,
        email: dto.email,
        phone: dto.phone,
        notes: JSON.stringify(payload),
      },
    });

    return { ok: true, reference: lead.leadNo };
  }
}