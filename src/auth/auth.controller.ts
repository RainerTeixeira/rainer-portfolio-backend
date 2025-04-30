import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

/**
 * Controlador responsável pelas rotas de autenticação.
 * 
 * Fornece o endpoint de login, utilizando o guard de autenticação local.
 */
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  // Injeta o serviço de autenticação
  constructor(private authService: AuthService) {}

  /**
   * Realiza o login do usuário.
   * 
   * Este endpoint utiliza o LocalAuthGuard para validar as credenciais do usuário.
   * Se as credenciais estiverem corretas, retorna um token de acesso e informações do usuário.
   * 
   * @param req Objeto de requisição contendo o usuário autenticado pelo guard.
   * @returns Objeto com token de acesso e dados do usuário.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Realiza login do usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'usuario' },
        password: { type: 'string', example: 'senha123' },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'jwt_token_aqui' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            username: { type: 'string', example: 'usuario' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
