import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { resolveStaffContext } from '../common/staff/staff-context';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from './clients.service';
import { QueryClientsDto } from './dto/query-clients.dto';

/**
 * Shared client catalogue — read by any staff member (e.g. the Finance cashier
 * picking a client on the receipt form). Authenticated-only, no permission codes.
 */
@Controller('staff/clients')
export class StaffClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryClientsDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.clients.list(query);
  }
}
