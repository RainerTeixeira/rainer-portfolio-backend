import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import type {
  LoginData,
  RegisterData,
  RefreshTokenData,
  ConfirmEmailData,
  ForgotPasswordData,
  ResetPasswordData,
} from './auth.model.js';

@ApiTags('🔐 Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '📝 Registrar Usuário' })
  async register(@Body() data: RegisterData) {
    const result = await this.authService.register(data);
    return { success: true, data: result };
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '✅ Confirmar Email' })
  async confirmEmail(@Body() data: ConfirmEmailData) {
    return await this.authService.confirmEmail(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔐 Login' })
  async login(@Body() data: LoginData) {
    const result = await this.authService.login(data);
    return { success: true, data: result };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔄 Renovar Token' })
  async refresh(@Body() data: RefreshTokenData) {
    const result = await this.authService.refreshToken(data);
    return { success: true, data: result };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '❓ Esqueci Minha Senha' })
  async forgotPassword(@Body() data: ForgotPasswordData) {
    return await this.authService.forgotPassword(data);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔑 Redefinir Senha' })
  async resetPassword(@Body() data: ResetPasswordData) {
    return await this.authService.resetPassword(data);
  }
}
