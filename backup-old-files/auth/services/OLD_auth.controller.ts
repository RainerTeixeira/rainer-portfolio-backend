import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { CognitoGuard } from './guards/cognito.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Realiza login do usuário
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Responde a desafio de autenticação (ex: senha temporária)
   */
  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  async respondToChallenge(@Body() challengeDto: any) {
    return this.authService.respondToAuthChallenge(
      challengeDto.challengeName,
      challengeDto.session,
      challengeDto.responses
    );
  }

  /**
   * Registra novo usuário
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  /**
   * Confirma cadastro do usuário
   */
  @Post('confirm-signup')
  @HttpCode(HttpStatus.OK)
  async confirmSignup(@Body() confirmDto: { email: string; code: string }) {
    return this.authService.confirmSignUp(confirmDto.email, confirmDto.code);
  }

  /**
   * Solicita recuperação de senha
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotDto: { email: string }) {
    return this.authService.forgotPassword(forgotDto.email);
  }

  /**
   * Confirma nova senha
   */
  @Post('confirm-forgot-password')
  @HttpCode(HttpStatus.OK)
  async confirmForgotPassword(
    @Body() confirmDto: { email: string; code: string; newPassword: string }
  ) {
    return this.authService.confirmForgotPassword(
      confirmDto.email,
      confirmDto.code,
      confirmDto.newPassword
    );
  }

  /**
   * Refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Valida token (endpoint para testes)
   */
  @Get('validate')
  @UseGuards(CognitoGuard)
  async validate(@Req() req: any) {
    return {
      valid: true,
      user: req.user,
    };
  }

  /**
   * Obtém perfil do usuário autenticado
   */
  @Get('profile')
  @UseGuards(CognitoGuard)
  async getProfile(@Req() req: any) {
    return {
      user: req.user,
    };
  }
}
