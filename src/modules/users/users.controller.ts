/**
 * Controlador de Usuários
 * 
 * Controller NestJS para rotas de usuários.
 * 
 * @module modules/users/users.controller
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
import { UsersService } from './users.service.js';
import type { CreateUserData, UpdateUserData } from './user.model.js';
import { FastifyFileInterceptor, type FastifyUploadedFile } from './interceptors/fastify-file.interceptor.js';

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
@ApiTags('👤 Usuários')
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
   * Cria um novo usuário
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
  async create(@Body() data: CreateUserData) {
    const user = await this.usersService.createUser(data);
    return { success: true, data: user };
  }

  /**
   * Lista todos os usuários com paginação
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
   * Busca usuário por Cognito Sub
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
   */
  @Put(':id')
  @UseInterceptors(
    new FastifyFileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (file: FastifyUploadedFile) => {
        return !!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/);
      },
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
    @Req() request: FastifyRequest
  ) {
    // Obter arquivo do request (adicionado pelo interceptor)
    const avatarFile = (request as any).file as FastifyUploadedFile | undefined;

    // Converter FastifyUploadedFile para um formato genérico de arquivo
    let expressFile: any;
    if (avatarFile) {
      expressFile = {
        fieldname: avatarFile.fieldname,
        originalname: avatarFile.filename,
        encoding: avatarFile.encoding,
        mimetype: avatarFile.mimetype,
        size: avatarFile.size,
        buffer: avatarFile.buffer,
        destination: '',
        filename: avatarFile.filename,
        path: '',
        stream: null as any,
      };
    }

    // Processar socialLinks se for string JSON
    if (typeof data.socialLinks === 'string') {
      try {
        data.socialLinks = JSON.parse(data.socialLinks);
      } catch {
        // Ignorar se não for JSON válido
        data.socialLinks = undefined;
      }
    }

    const user = await this.usersService.updateUser(cognitoSub, data, expressFile);
    return { success: true, data: user };
  }

  /**
   * Deleta um usuário
   * 
   * ATUALIZADO: Agora usa cognitoSub como identificador principal
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

