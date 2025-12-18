/**
 * @fileoverview Controller de Usuários
 *
 * Controller NestJS responsável por expor endpoints HTTP para criação, consulta,
 * listagem, atualização e remoção de usuários.
 *
 * Papel deste controller:
 * - Receber entradas via `@Body`, `@Param`, `@Query`.
 * - Delegar regras de negócio para `UsersService`.
 * - Documentar a API com Swagger (`@ApiOperation`, `@ApiResponse`, etc.).
 *
 * Observação de domínio:
 * - Nesta API, `cognitoSub` (UUID do AWS Cognito) é tratado como identificador
 *   principal do usuário em vários endpoints.
 *
 * @module modules/users/controllers/users.controller
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserData } from '../dto/create-user.dto';
import { FastifyFileInterceptor, type FastifyUploadedFile } from '../../../common/interceptors/fastify-file.interceptor';

/**
 * Controller de Usuários
 * 
 * Rotas:
 * - POST   /users           - Criar usuário
 * - GET    /users           - Listar usuários
 * - GET    /users/:id       - Buscar por ID
 * - GET    /users/cognito/:cognitoSub - Buscar por Cognito Sub
 * - PUT    /users/:id       - Atualizar usuário
 * - DELETE /users/:id       - Deletar usuário
 * - PATCH  /users/:id/verify - Verificar email
 */
@ApiTags('users')
@Controller('users')
/**
 * Controlador NestJS responsável por gerenciar recursos de usuários.
 *
 * Contexto: utiliza `cognitoSub` como identificador primário vindo do AWS Cognito,
 * mantendo dados complementares no banco de dados da aplicação.
 *
 * Convenções de resposta:
 * - Retorna objetos com `success` e `data`/`message` conforme aplicável.
 * - Upload de avatar via multipart/form-data com Fastify e integração Cloudinary.
 *
 * Observações:
 * - Decorators Swagger documentam parâmetros, corpos e respostas por endpoint.
 * - Este bloco é apenas documentação JSDoc; nenhuma lógica foi alterada.
 */
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Cria um novo usuário.
   *
   * Em geral este endpoint é usado para criar o registro complementar no banco
   * da aplicação (enquanto a identidade principal pode estar no Cognito).
   *
   * @param {CreateUserDto} data Dados do usuário.
   * @returns {Promise<{ success: true; data: unknown }>} Envelope com usuário criado.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '➕ Criar Usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email ou username já existe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cognitoSub: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        fullName: { type: 'string', example: 'John Doe' },
        bio: { type: 'string', example: 'Desenvolvedor full-stack', nullable: true },
        avatar: { type: 'string', example: 'https://avatar.url/image.jpg', nullable: true },
        role: { type: 'string', example: 'AUTHOR', enum: ['ADMIN', 'EDITOR', 'AUTHOR', 'SUBSCRIBER'], nullable: true },
      },
      required: ['cognitoSub', 'fullName'],
    },
  })
  async create(@Body() data: CreateUserDto) {
    const user = await this.usersService.createUser(data);
    return { success: true, data: user };
  }

  /**
   * Lista usuários com paginação e filtros.
   *
   * @param {number} [page] Página atual (1-indexado).
   * @param {number} [limit] Quantidade por página.
   * @param {string} [role] Filtro por role.
   * @param {string} [search] Termo de busca.
   * @returns {Promise<unknown>} Resultado paginado.
   */
  @Get()
  @ApiOperation({ summary: '📋 Listar Usuários' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async list(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.usersService.listUsers({ page, limit, role, search });
    return { success: true, ...result };
  }

  /**
   * Busca usuário por CognitoSub (chave primária)
   * 
   * ATUALIZADO: Agora usa cognitoSub como identificador principal ao invés de id
   *
   * @param {string} cognitoSub CognitoSub do usuário.
   * @returns {Promise<{ success: true; data: unknown }>} Envelope com usuário encontrado.
   */
  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Usuário por CognitoSub' })
  @ApiParam({ name: 'id', description: 'CognitoSub do usuário (chave primária)' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(@Param('id') cognitoSub: string) {
    const user = await this.usersService.getUserById(cognitoSub);
    return { success: true, data: user };
  }

  /**
   * Busca usuário por Cognito Sub.
   *
   * @param {string} cognitoSub Cognito Sub do usuário.
   * @returns {Promise<{ success: true; data: unknown }>} Envelope com usuário encontrado.
   */
  @Get('cognito/:cognitoSub')
  @ApiOperation({ 
    summary: '🔍 Buscar por Cognito Sub',
    description: 'Busca usuário pelo identificador único do Cognito. Email vem do Cognito, não do MongoDB.'
  })
  @ApiParam({ name: 'cognitoSub', description: 'Cognito Sub (UUID do usuário no Cognito)' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findByCognitoSub(@Param('cognitoSub') cognitoSub: string) {
    const user = await this.usersService.getUserByCognitoSub(cognitoSub);
    return { success: true, data: user };
  }



  /**
   * Atualiza um usuário
   * 
   * ATUALIZADO: Agora usa cognitoSub como identificador principal
   * ATUALIZADO: Suporta upload de avatar via multipart/form-data usando Fastify
   *
   * Observações:
   * - Os campos de formulário chegam em `data`.
   * - Se `socialLinks` vier como string JSON, é convertido para objeto.
   * - O arquivo (quando enviado) fica disponível em `request.file` via interceptor.
   *
   * @param {string} cognitoSub CognitoSub do usuário.
   * @param {UpdateUserData} data Campos para atualização.
   * @returns {Promise<{ success: true; data: unknown }>} Envelope com usuário atualizado.
   */
  @Put(':id')
  @UseInterceptors(
    new FastifyFileInterceptor('avatar', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      // Aceita qualquer imagem (image/*); CloudinaryService se encarrega de converter/comprimir para WebP
      fileFilter: (file: FastifyUploadedFile) => file.mimetype.startsWith('image/'),
    })
  )
  @ApiOperation({ 
    summary: '✏️ Atualizar Usuário',
    description: 'Atualiza dados complementares no MongoDB. Suporta upload de avatar para Cloudinary em formato WebP otimizado. ⚠️ Email NÃO pode ser alterado aqui (use /auth/change-email)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'CognitoSub do usuário (chave primária)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem para avatar (JPG, PNG, GIF, WebP - Máximo 2MB). Será otimizado para WebP no Cloudinary.',
        },
        fullName: { type: 'string', example: 'John Doe Updated', nullable: true },
        bio: { type: 'string', example: 'Nova bio do usuário', nullable: true },
        website: { type: 'string', example: 'https://mywebsite.com', nullable: true },
        socialLinks: { 
          type: 'string', 
          description: 'JSON string com links sociais',
          example: '{"twitter": "https://twitter.com/user", "github": "https://github.com/user"}', 
          nullable: true 
        },
        role: { type: 'string', example: 'AUTHOR', enum: ['ADMIN', 'EDITOR', 'AUTHOR', 'SUBSCRIBER'], nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Usuário atualizado (email vem do Cognito)' })
  async update(
    @Param('id') cognitoSub: string, 
    @Body() data: UpdateUserData,
    @Req() _request: FastifyRequest
  ) {
    // TODO: Implementar upload do arquivo para o Cloudinary aqui
    // Por enquanto, apenas processamos os dados do formulário

    // Garantir que sempre temos um objeto de dados seguro, mesmo em uploads só de avatar
    const safeData: UpdateUserData = (data || {}) as UpdateUserData;

    // Processar socialLinks se for string JSON
    if (typeof safeData.socialLinks === 'string') {
      try {
        safeData.socialLinks = JSON.parse(safeData.socialLinks);
      } catch {
        // Ignorar se não for JSON válido
        safeData.socialLinks = undefined;
      }
    }

    const user = await this.usersService.updateUser(cognitoSub, safeData);
    return { success: true, data: user };
  }

  /**
   * Deleta um usuário
   * 
   * ATUALIZADO: Agora usa cognitoSub como identificador principal
   *
   * @param {string} cognitoSub CognitoSub do usuário.
   * @returns {Promise<unknown>} Resultado da remoção.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🗑️ Deletar Usuário' })
  @ApiParam({ name: 'id', description: 'CognitoSub do usuário (chave primária)' })
  async deleteUser(@Param('id') cognitoSub: string) {
    const result = await this.usersService.deleteUser(cognitoSub);
    return result;
  }

}

