import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(loginDto);
    const { accessToken, refreshToken, user: userData } = await this.authService.login(user);

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    // Set Access Token cookie (HttpOnly)
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Set Refresh Token cookie (HttpOnly)
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return {
      message: 'Login successful',
      user: userData,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const { accessToken, user } = await this.authService.refresh(refreshToken);
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    return {
      message: 'Token refreshed successfully',
      user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/' });
    return {
      message: 'Logout successful',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return { user };
  }
}
