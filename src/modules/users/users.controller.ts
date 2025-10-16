/**
 * Users Controller
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import type { CreateUserData, UpdateUserData } from './user.model.js';

/**
 * Controller de Usuários
 * 
 * Rotas:
 * - POST   /users           - Criar usuário
 * - GET    /users           - Listar usuários
 * - GET    /users/:id       - Buscar por ID
 * - GET    /users/username/:username - Buscar por username
 * - PUT    /users/:id       - Atualizar usuário
 * - DELETE /users/:id       - Deletar usuário
 * - PATCH  /users/:id/verify - Verificar email
 */
@ApiTags('👤 Usuários')
@Controller('users')
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
  async create(@Body() data: CreateUserData & { password: string }) {
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
   * Busca usuário por ID
   */
  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Usuário por ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.getUserById(id);
    return { success: true, data: user };
  }

  /**
   * Busca usuário por username
   */
  @Get('username/:username')
  @ApiOperation({ summary: '🔍 Buscar por Username' })
  @ApiParam({ name: 'username', description: 'Username do usuário' })
  async findByUsername(@Param('username') username: string) {
    const user = await this.usersService.getUserByUsername(username);
    return { success: true, data: user };
  }

  /**
   * Atualiza um usuário
   */
  @Put(':id')
  @ApiOperation({ summary: '✏️ Atualizar Usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  async update(@Param('id') id: string, @Body() data: UpdateUserData) {
    const user = await this.usersService.updateUser(id, data);
    return { success: true, data: user };
  }

  /**
   * Deleta um usuário
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🗑️ Deletar Usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  async deleteUser(@Param('id') id: string) {
    const result = await this.usersService.deleteUser(id);
    return result;
  }

}

