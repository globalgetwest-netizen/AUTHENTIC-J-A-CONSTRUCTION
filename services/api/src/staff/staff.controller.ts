import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.staffService.profile(user.id);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: AuthUser) {
    return this.staffService.notifications(user.id);
  }
}