import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { RolesService } from './roles.service';
import type { RoleWithPermissions } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  list(): Promise<RoleWithPermissions[]> {
    return this.rolesService.list();
  }

  @Get(':id')
  @RequirePermissions('roles.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<RoleWithPermissions> {
    return this.rolesService.get(id);
  }

  @Post()
  @RequirePermissions('roles.write')
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateRoleDto): Promise<RoleWithPermissions> {
    return this.rolesService.create(dto, { actorId: actor.id });
  }

  @Patch(':id')
  @RequirePermissions('roles.write')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleWithPermissions> {
    return this.rolesService.update(id, dto, { actorId: actor.id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('roles.write')
  async remove(@CurrentUser() actor: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.rolesService.remove(id, { actorId: actor.id });
  }
}
