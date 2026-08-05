import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { Public } from '../common/auth/public.decorator';
import { AuthService } from './auth.service';
import type { AuthTokens, ClientMeta, LoginResult } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResult> {
    return this.authService.login(dto, clientMeta(req));
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken, clientMeta(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto, @Req() req: Request): Promise<void> {
    await this.authService.logout(dto.refreshToken, clientMeta(req));
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.authService.changePassword(user.id, dto, clientMeta(req));
  }
}

function clientMeta(req: Request): ClientMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress =
    typeof forwarded === 'string' && forwarded.length > 0
      ? forwarded.split(',')[0]?.trim()
      : (req.socket?.remoteAddress ?? undefined);
  return { ipAddress, userAgent: req.headers['user-agent'] ?? undefined };
}
