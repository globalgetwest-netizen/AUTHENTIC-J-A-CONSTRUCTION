import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { StaffClientsController } from './staff-clients.controller';

@Module({
  controllers: [ClientsController, StaffClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
