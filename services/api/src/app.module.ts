import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthGuard } from './common/auth/auth.guard';
import { PermissionsGuard } from './common/auth/permissions.guard';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { CompanyModule } from './company/company.module';
import { ClientsModule } from './clients/clients.module';
import { LeadsModule } from './leads/leads.module';
import { ProjectsModule } from './projects/projects.module';
import { SystemModule } from './system/system.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    CompanyModule,
    ClientsModule,
    LeadsModule,
    ProjectsModule,
    SystemModule,
    RequestsModule,
  ],
  providers: [
    // Registered in order: AuthGuard first (attaches the user), then PermissionsGuard.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
