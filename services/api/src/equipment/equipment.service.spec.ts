import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { EquipmentStatus, MaintenanceStatus } from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from './equipment.service';

type MockCrud = Record<
  'findFirst' | 'findUnique' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany' | 'deleteMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): { service: EquipmentService; equipment: MockCrud; vehicle: MockCrud; maintenance: MockCrud; asset: MockCrud; assignment: MockCrud } {
  const make = (): MockCrud => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  });
  const equipment = make();
  const vehicle = make();
  const maintenance = make();
  const asset = make();
  const assignment = make();
  const prisma = {
    equipment,
    vehicle,
    maintenanceRecord: maintenance,
    asset,
    assetAssignment: assignment,
  } as unknown as PrismaService;
  return { service: new EquipmentService(prisma), equipment, vehicle, maintenance, asset, assignment };
}

describe('EquipmentService', () => {
  it('creates equipment with an auto EQP code and AVAILABLE status', async () => {
    const { service, equipment } = makeService();
    equipment.create.mockImplementation(({ data }) => Promise.resolve({ id: 'e1', ...data }));

    const created = await service.createEquipment({ name: 'Excavator 30t', category: 'HEAVY' });

    expect(created.assetCode).toMatch(/^EQP-/);
    expect(created.status).toBe(EquipmentStatus.AVAILABLE);
    expect(created.category).toBe('HEAVY');
  });

  it('lists equipment excluding soft-deleted with status filter', async () => {
    const { service, equipment } = makeService();
    equipment.findMany.mockResolvedValue([{ id: 'e1' }]);
    equipment.count.mockResolvedValue(1);

    const result = await service.listEquipments({
      page: 1,
      pageSize: 20,
      status: EquipmentStatus.IN_USE,
    });

    expect(result.data).toEqual([{ id: 'e1' }]);
    const where = equipment.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(where.status).toBe(EquipmentStatus.IN_USE);
  });

  it('throws NotFound when creating a vehicle for missing equipment', async () => {
    const { service, equipment } = makeService();
    equipment.findFirst.mockResolvedValue(null);
    await expect(
      service.createVehicle({ equipmentId: 'e1', registrationNo: 'GW-1234-20' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('upserts a vehicle onto its equipment when one already exists', async () => {
    const { service, equipment, vehicle } = makeService();
    equipment.findFirst.mockResolvedValue({ id: 'e1' });
    vehicle.findUnique.mockResolvedValue({ id: 'v1' });
    vehicle.update.mockResolvedValue({ id: 'v1' });

    await service.createVehicle({ equipmentId: 'e1', registrationNo: 'GW-1234-20' });

    expect(vehicle.update).toHaveBeenCalled();
    expect(vehicle.create).not.toHaveBeenCalled();
  });

  it('creates maintenance with an auto SCHEDULED status', async () => {
    const { service, equipment, maintenance } = makeService();
    equipment.findFirst.mockResolvedValue({ id: 'e1' });
    maintenance.create.mockImplementation(({ data }) => Promise.resolve({ id: 'm1', ...data }));

    const created = await service.createMaintenance({ equipmentId: 'e1', scheduledAt: '2026-08-10' });

    expect(created.status).toBe(MaintenanceStatus.SCHEDULED);
    expect(maintenance.create).toHaveBeenCalled();
  });

  it('completes a maintenance record with a computed completedAt', async () => {
    const { service, maintenance } = makeService();
    maintenance.findFirst.mockResolvedValue({ id: 'm1' });
    maintenance.update.mockResolvedValue({ id: 'm1', status: MaintenanceStatus.COMPLETED });

    const completed = await service.completeMaintenance('m1');

    expect(completed.status).toBe(MaintenanceStatus.COMPLETED);
    expect(maintenance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: MaintenanceStatus.COMPLETED, completedAt: expect.any(Date) }),
      }),
    );
  });

  it('creates an asset with an auto AST code', async () => {
    const { service, asset } = makeService();
    asset.create.mockImplementation(({ data }) => Promise.resolve({ id: 'a1', ...data }));

    const created = await service.createAsset({ name: 'Laptop', category: 'IT' });

    expect(created.assetCode).toMatch(/^AST-/);
    expect(created.status).toBe('ACTIVE');
  });

  it('creates an assignment and returns it', async () => {
    const { service, asset, assignment } = makeService();
    asset.findFirst.mockResolvedValue({ id: 'a1' });
    assignment.create.mockResolvedValue({ id: 'as1' });
    assignment.findFirst.mockResolvedValue({ id: 'as1' });
    assignment.update.mockResolvedValue({ id: 'as1', returnedAt: new Date() });

    await service.createAssignment({ assetId: 'a1', assignedToId: 'emp1' });
    expect(assignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ assignedAt: expect.any(Date) }) }),
    );

    const returned = await service.returnAssignment('as1');
    expect(returned.returnedAt).toBeInstanceOf(Date);
  });

  it('throws NotFound when soft-deleting unknown equipment', async () => {
    const { service, equipment } = makeService();
    equipment.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.removeEquipment('missing')).rejects.toThrow(NotFoundException);
  });
});