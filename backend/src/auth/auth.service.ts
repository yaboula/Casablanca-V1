import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: string;
  user: Omit<User, 'passwordHash'>;
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
    // Load user with passwordHash (normally excluded by select:false)
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

  private buildTokenResponse(user: User): AuthTokenResponse {
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '7d');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn });

    // Strip passwordHash from the response object
    const { passwordHash: _removed, ...safeUser } = user as User & {
      passwordHash?: string;
    };

    return {
      accessToken,
      expiresIn,
      user: safeUser as Omit<User, 'passwordHash'>,
    };
  }
}
