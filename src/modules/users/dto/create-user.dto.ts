/**
 * @fileoverview DTOs de usuário (criação e atualização)
 *
 * Este arquivo concentra DTOs relacionados a usuários.
 *
 * - `CreateUserDto`: payload aceito para criação de usuário (muitas vezes usado
 *   na sincronização com o Cognito).
 * - `UpdateUserData`: payload aceito para atualização de perfil/dados complementares.
 *
 * Observação de domínio:
 * - `cognitoSub` representa o identificador do usuário no AWS Cognito.
 * - Nem todos os campos são obrigatórios pois o fluxo pode depender do provider.
 *
 * @module modules/users/dto/create-user.dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

/**
 * Payload para criação/sincronização de usuário.
 */
export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'ID do usuário no Cognito',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsOptional()
  cognitoSub?: string;

  @ApiPropertyOptional({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Nome do usuário (legado)',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Username único',
    example: 'joaosilva',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Senha do usuário',
    example: 'senha123',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Nickname/apelido',
    example: 'João',
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'URL do avatar',
    example: 'https://example.com/avatars/joao.jpg',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Biografia do usuário',
    example: 'Desenvolvedor apaixonado por tecnologia',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Website pessoal',
    example: 'https://joaosilva.dev',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'Links para redes sociais',
    type: 'object',
    additionalProperties: true,
    example: {
      github: 'https://github.com/joaosilva',
      linkedin: 'https://linkedin.com/in/joaosilva',
      twitter: 'https://twitter.com/joaosilva'
    },
  })
  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Função do usuário',
    enum: ['ADMIN', 'EDITOR', 'AUTHOR', 'SUBSCRIBER'],
    example: 'AUTHOR',
  })
  @IsEnum(['ADMIN', 'EDITOR', 'AUTHOR', 'SUBSCRIBER'])
  @IsOptional()
  role?: string;
}

/**
 * Payload para atualização de dados do usuário.
 *
 * Usado principalmente em endpoints de update de perfil.
 */
export class UpdateUserData {
  @ApiPropertyOptional({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Nickname/apelido',
    example: 'João',
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'URL do avatar',
    example: 'https://example.com/avatars/joao.jpg',
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Biografia do usuário',
    example: 'Desenvolvedor apaixonado por tecnologia',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Website pessoal',
    example: 'https://joaosilva.dev',
  })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'Links para redes sociais',
    type: 'object',
    additionalProperties: true,
    example: {
      github: 'https://github.com/joaosilva',
      linkedin: 'https://linkedin.com/in/joaosilva',
      twitter: 'https://twitter.com/joaosilva'
    },
  })
  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Função do usuário',
    enum: ['ADMIN', 'EDITOR', 'AUTHOR', 'SUBSCRIBER'],
    example: 'AUTHOR',
  })
  @IsEnum(['ADMIN', 'EDITOR', 'AUTHOR', 'SUBSCRIBER'])
  @IsOptional()
  role?: string;
}
