import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: Omit<User, 'passwordHash' | 'tokenVersion'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
    });

    return this.buildTokenResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    return this.buildTokenResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    const user = await this.usersService.findByIdWithTokenVersion(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no válido.');
    }

    if ((payload.tokenVersion ?? 0) !== user.tokenVersion) {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    const nextTokenVersion = user.tokenVersion + 1;
    await this.usersService.incrementTokenVersion(user.id);

    return this.buildTokenResponse(user, nextTokenVersion);
  }

  async logout(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no válido.');
    }

    await this.usersService.incrementTokenVersion(user.id);
  }

  private buildTokenResponse(
    user: User,
    refreshTokenVersion = user.tokenVersion ?? 0,
  ): AuthTokenResponse {
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '7d');
    const refreshExpiresIn = this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    );
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: refreshTokenVersion,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn });
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    const { passwordHash: _removed, tokenVersion: _tokenVersion, ...safeUser } =
      user as User & {
        passwordHash?: string;
        tokenVersion?: number;
      };

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: safeUser as Omit<User, 'passwordHash' | 'tokenVersion'>,
    };
  }
}
