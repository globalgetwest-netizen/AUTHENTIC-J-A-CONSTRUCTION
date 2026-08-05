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
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import type { Paginated } from '../common/dto/pagination.dto';
import { UsersService } from './users.service';
import type { SafeUser } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.read')
  list(@Query() query: QueryUsersDto): Promise<Paginated<SafeUser>> {
    return this.usersService.list(query);
  }

  @Get(':id')
  @RequirePermissions('users.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<SafeUser> {
    return this.usersService.get(id);
  }

  @Post()
  @RequirePermissions('users.write')
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateUserDto): Promise<SafeUser> {
    return this.usersService.create(dto, { actorId: actor.id });
  }

  @Patch(':id')
  @RequirePermissions('users.write')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<SafeUser> {
    return this.usersService.update(id, dto, { actorId: actor.id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('users.write')
  async remove(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.usersService.remove(id, actor.id, { actorId: actor.id });
  }
}
