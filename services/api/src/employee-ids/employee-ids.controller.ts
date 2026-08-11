import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, StreamableFile } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { Public } from '../common/auth/public.decorator';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { EmployeeIdsService } from './employee-ids.service';
import { CreateEmployeeIdDto } from './dto/create-employee-id.dto';
import { QueryEmployeeIdsDto } from './dto/employee-id-query.dto';
import { VerifyEmployeeIdDto } from './dto/verify-employee-id.dto';

@Controller('employee-ids')
export class EmployeeIdsController {
  constructor(private readonly service: EmployeeIdsService) {}

  @Get()
  @RequirePermissions('employee-ids.read')
  list(@Query() query: QueryEmployeeIdsDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @RequirePermissions('employee-ids.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  @RequirePermissions('employee-ids.write')
  issue(@Body() dto: CreateEmployeeIdDto) {
    return this.service.issue(dto);
  }

  @Post(':id/revoke')
  @RequirePermissions('employee-ids.write')
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.revoke(id);
  }

  /** Reachable without a token so a guard can scan the card using any device. */
  @Public()
  @Post('verify')
  verify(@Body() dto: VerifyEmployeeIdDto, @Req() req: Request) {
    return this.service.verify(dto, req.ip);
  }

  /** Headshot for the public verify page — gated by the same card+token as verify. */
  @Public()
  @Get('verify/photo')
  async verifyPhoto(
    @Query() query: { card: string; t?: string },
  ): Promise<StreamableFile> {
    const { stream, length, type, filename } = await this.service.openPhotoForVerification(
      query.card,
      query.t,
    );
    return new StreamableFile(stream, { type, length, disposition: `inline; filename="${filename}"` });
  }
}

/** The logged-in staff member's own ID card for self-service + card download. */
@Controller('staff/employee-id')
export class StaffEmployeeIDsController {
  constructor(private readonly service: EmployeeIdsService) {}

  @Get()
  myCard(@CurrentUser() user: AuthUser) {
    return this.service.myCard(user.id);
  }

  /** The staff member's own headshot (used by the self-service card PDF). */
  @Get('photo')
  async myPhoto(@CurrentUser() user: AuthUser): Promise<StreamableFile> {
    const { stream, length, type, filename } = await this.service.myPhoto(user.id);
    return new StreamableFile(stream, { type, length, disposition: `inline; filename="${filename}"` });
  }
}