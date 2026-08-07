import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { ClientService } from './client.service';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.clientService.profile(user.id);
  }

  @Get('quotations')
  quotations(@CurrentUser() user: AuthUser) {
    return this.clientService.quotations(user.id);
  }

  @Get('quotations/:id')
  quotation(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.clientService.quotation(user.id, id);
  }
}
