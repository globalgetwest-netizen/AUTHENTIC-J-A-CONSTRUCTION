import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { RequestsService } from './requests.service';

type MockPrisma = { lead: { create: ReturnType<typeof vi.fn> } };

function makeService(): { service: RequestsService; lead: MockPrisma['lead'] } {
  const lead: MockPrisma['lead'] = { create: vi.fn() };
  const prisma = { lead } as unknown as PrismaService;
  return { service: new RequestsService(prisma), lead };
}

describe('RequestsService', () => {
  it('creates a NEW website-sourced lead with a generated reference', async () => {
    const { service, lead } = makeService();
    lead.create.mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'ld1' }));

    const result = await service.submit({
      requestType: 'quote',
      fullName: 'Ama Mensah',
      company: 'Mensah Holdings',
      email: 'ama@example.com',
      phone: '0245123456',
      whatsapp: '0245123456',
      projectType: 'Residential',
      service: 'Building Construction',
      budgetRange: 'GHS 100k – 500k',
      preferredLocation: 'Kumasi',
      description: 'Two-storey family house',
      preferredContactMethod: 'phone',
      attachmentName: 'floorplan.pdf',
    });

    expect(result.ok).toBe(true);
    expect(result.reference).toMatch(/^LD-/);
    expect(lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'WEBSITE',
          status: 'NEW',
          name: 'Ama Mensah',
          company: 'Mensah Holdings',
          email: 'ama@example.com',
          phone: '0245123456',
        }),
      }),
    );

    const data = lead.create.mock.calls[0]?.[0]?.data;
    const notes = JSON.parse(data.notes);
    expect(notes.requestType).toBe('quote');
    expect(notes.preferredContactMethod).toBe('phone');
    expect(notes.attachmentName).toBe('floorplan.pdf');
    expect(notes.submittedAt).toEqual(expect.any(String));
  });

  it('stores optional fields as null when omitted', async () => {
    const { service, lead } = makeService();
    lead.create.mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'ld2' }));

    await service.submit({
      requestType: 'land',
      fullName: 'Kwame Boateng',
      email: 'kwame@example.com',
      phone: '0245000000',
    });

    const data = lead.create.mock.calls[0]?.[0]?.data;
    const notes = JSON.parse(data.notes);
    expect(notes.budgetRange).toBeNull();
    expect(notes.preferredLocation).toBeNull();
    expect(notes.description).toBeNull();
  });
});
