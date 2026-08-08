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
import { QuotationsModule } from './quotations/quotations.module';
import { EmployeesModule } from './employees/employees.module';
import { OrgModule } from './org/org.module';
import { PropertiesModule } from './properties/properties.module';
import { LandModule } from './land/land.module';
import { MaterialsModule } from './materials/materials.module';
import { BlocksModule } from './blocks/blocks.module';
import { EquipmentModule } from './equipment/equipment.module';
import { FinanceModule } from './finance/finance.module';
import { PayrollModule } from './payroll/payroll.module';
import { EmployeeIdsModule } from './employee-ids/employee-ids.module';
import { SystemModule } from './system/system.module';
import { RequestsModule } from './requests/requests.module';
import { StaffModule } from './staff/staff.module';
import { ClientModule } from './client/client.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';

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
    QuotationsModule,
    EmployeesModule,
    OrgModule,
    PropertiesModule,
    LandModule,
    MaterialsModule,
    BlocksModule,
    EquipmentModule,
    FinanceModule,
    PayrollModule,
    EmployeeIdsModule,
    SystemModule,
    RequestsModule,
    StaffModule,
    ClientModule,
    NotificationsModule,
    DocumentsModule,
  ],
  providers: [
    // Registered in order: AuthGuard first (attaches the user), then PermissionsGuard.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
