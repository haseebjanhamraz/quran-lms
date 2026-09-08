import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcrypt';

import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<any> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isActive === false && user.accountStatus !== 'TERMINATED' && user.accountStatus !== 'SUSPENDED' && user.accountStatus !== 'ON_LEAVE') {
      throw new UnauthorizedException('Your account has been deactivated. Please contact an administrator.');
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    const isPasswordValid = await bcrypt.compare(loginDto.password, userObj.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash: _, ...result } = userObj;
    if (result._id) {
      result.id = result._id.toString();
    }
    return result;
  }

  async login(user: any, rememberMe?: boolean) {
    const permissions = await this.permissionsService.getUserPermissions(user.role);
    const userWithPerms = { ...user, permissions };
    const userId = (user.id || user._id)?.toString();
    const payload = {
      email: user.email,
      sub: userId,
      role: user.role,
      accountStatus: user.accountStatus || 'ACTIVE',
    };

    const accessExpiry = rememberMe ? '30d' : (this.configService.get<string>('JWT_EXPIRY') || '7d');
    const refreshExpiry = rememberMe ? '30d' : (this.configService.get<string>('JWT_REFRESH_EXPIRY') || '30d');
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessExpiry as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiry as any,
    });

    // Log the user login event
    try {
      await this.auditLogsService.log('USER_LOGIN', userId, { email: user.email, role: user.role });
    } catch (_) {}

    return {
      user: userWithPerms,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid refresh token: missing user identifier');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid user session');
      }

      const permissions = await this.permissionsService.getUserPermissions(user.role);
      const userWithPerms = { ...user, permissions };

      const userId = (user.id || user._id)?.toString();
      const newPayload = {
        email: user.email,
        sub: userId,
        role: user.role,
        accountStatus: user.accountStatus || 'ACTIVE',
      };

      const isLongLived = Boolean(payload.exp && payload.iat && (payload.exp - payload.iat > 8 * 24 * 60 * 60));
      const accessExpiry = isLongLived ? '30d' : (this.configService.get<string>('JWT_EXPIRY') || '7d');

      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: accessExpiry as any,
      });

      return {
        accessToken: newAccessToken,
        user: userWithPerms,
        isLongLived,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
