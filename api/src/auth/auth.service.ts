import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { User, WeightUnit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IssuedTokens } from './auth.cookies';

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  weightUnit: WeightUnit;
  isAdmin: boolean;
};
export type AuthResult = { user: PublicUser } & IssuedTokens;

interface RefreshPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get accessSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }
  private get refreshSecret(): string {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }
  private get accessTtl(): number {
    return Number(this.config.get<string>('JWT_ACCESS_TTL') ?? 900);
  }
  private get refreshTtl(): number {
    return Number(this.config.get<string>('JWT_REFRESH_TTL') ?? 604800);
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private get adminEmails(): string[] {
    return (this.config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  private toPublic(u: User): PublicUser {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      weightUnit: u.weightUnit,
      isAdmin: u.isAdmin,
    };
  }

  async updateWeightUnit(
    userId: string,
    weightUnit: WeightUnit,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { weightUnit },
    });
    return this.toPublic(user);
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email.');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({
      email,
      passwordHash,
      name: dto.name.trim(),
      isAdmin: this.adminEmails.includes(email),
    });
    return { user: this.toPublic(user), ...(await this.issueTokens(user)) };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findByEmail(email);
    // Comparamos siempre (aunque no exista) para no filtrar qué emails están registrados
    const ok = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;
    if (!user || !ok) {
      throw new UnauthorizedException('Email o contraseña incorrectos.');
    }
    // sincroniza el rol admin con ADMIN_EMAILS en cada login
    const shouldBeAdmin = this.adminEmails.includes(email);
    const authed =
      user.isAdmin === shouldBeAdmin
        ? user
        : await this.prisma.user.update({
            where: { id: user.id },
            data: { isAdmin: shouldBeAdmin },
          });
    return { user: this.toPublic(authed), ...(await this.issueTokens(authed)) };
  }

  async refresh(rawRefresh: string | undefined): Promise<AuthResult> {
    if (!rawRefresh) {
      throw new UnauthorizedException('No hay sesión.');
    }
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(rawRefresh, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Sesión expirada.');
    }

    const record = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    const hashOk = !!record && record.tokenHash === this.sha256(rawRefresh);

    // Token inexistente, adulterado, ya revocado (reuso) o vencido → rechazamos.
    // Si el token era válido pero ya estaba revocado, es posible robo: revocamos
    // todas las sesiones del usuario por precaución.
    if (!record || !hashOk || record.revoked || record.expiresAt < new Date()) {
      if (record?.revoked) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: record.userId, revoked: false },
          data: { revoked: true },
        });
      }
      throw new UnauthorizedException('Sesión inválida.');
    }

    // Rotación: revocamos el actual y emitimos uno nuevo.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revoked: true },
    });

    const user = await this.users.findById(record.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    return { user: this.toPublic(user), ...(await this.issueTokens(user)) };
  }

  async logout(rawRefresh: string | undefined): Promise<void> {
    if (!rawRefresh) return;
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(rawRefresh, {
        secret: this.refreshSecret,
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.jti, revoked: false },
        data: { revoked: true },
      });
    } catch {
      // token inválido/expirado: no hay nada que revocar
    }
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }

  private async issueTokens(user: User): Promise<IssuedTokens> {
    const accessTtl = this.accessTtl;
    const refreshTtl = this.refreshTtl;

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, isAdmin: user.isAdmin },
      { secret: this.accessSecret, expiresIn: accessTtl },
    );

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      { secret: this.refreshSecret, expiresIn: refreshTtl },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId: user.id,
        tokenHash: this.sha256(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return { accessToken, refreshToken, accessTtl, refreshTtl };
  }
}
