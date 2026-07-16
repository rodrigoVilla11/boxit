import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService, PublicUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from './auth.cookies';

// Límite estricto para endpoints sensibles: 10 intentos por minuto por IP.
const SENSITIVE_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle(SENSITIVE_THROTTLE)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const { user, ...tokens } = await this.auth.register(dto);
    setAuthCookies(res, tokens);
    return { user };
  }

  @Throttle(SENSITIVE_THROTTLE)
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const { user, ...tokens } = await this.auth.login(dto);
    setAuthCookies(res, tokens);
    return { user };
  }

  @Throttle(SENSITIVE_THROTTLE)
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const { user, ...tokens } = await this.auth.refresh(raw);
    setAuthCookies(res, tokens);
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.auth.logout(raw);
    clearAuthCookies(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser): Promise<{ user: PublicUser }> {
    return { user: await this.auth.me(user.id) };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMeDto,
  ): Promise<{ user: PublicUser }> {
    return { user: await this.auth.updateProfile(user.id, dto) };
  }

  @Throttle(SENSITIVE_THROTTLE)
  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const { user: updated, ...tokens } = await this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    setAuthCookies(res, tokens);
    return { user: updated };
  }

  @Delete('me')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async deleteMe(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.deleteAccount(user.id);
    clearAuthCookies(res);
  }
}
