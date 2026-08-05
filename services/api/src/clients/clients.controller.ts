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
import type { Client } from '@ajac/database';
import type { Paginated } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @RequirePermissions('clients.read')
  list(@Query() query: QueryClientsDto): Promise<Paginated<Client>> {
    return this.clientsService.list(query);
  }

  @Get(':id')
  @RequirePermissions('clients.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Client> {
    return this.clientsService.get(id);
  }

  @Post()
  @RequirePermissions('clients.write')
  create(@Body() dto: CreateClientDto): Promise<Client> {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('clients.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto): Promise<Client> {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('clients.write')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.clientsService.remove(id);
  }
}
