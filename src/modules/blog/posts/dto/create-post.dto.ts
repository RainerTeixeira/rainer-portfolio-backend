import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'ID da categoria do post. Utilizado para associar o post a uma categoria específica.',
    example: '2'
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'ID da subcategoria do post. Referencia a subcategoria dentro da categoria principal.',
    example: '3'
  })
  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiProperty({
    description: 'Conteúdo HTML do post. Este campo deve conter o corpo completo do post em formato HTML.',
    example: '<h1>Introdução ao GraphQL</h1><p>GraphQL é uma linguagem de consulta para APIs...</p>'
  })
  @IsString()
  @IsNotEmpty()
  contentHTML: string;

  @ApiProperty({
    description: 'ID do autor do post. Utilizado para associar o post a um autor específico.',
    example: '2'
  })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({
    description: 'Data de publicação do post no formato ISO 8601.',
    example: '2024-09-25T10:00:00Z'
  })
  @IsString()
  @IsNotEmpty()
  publishDate: string;

  @ApiProperty({
    description: 'Slug do post. Uma versão amigável do título para a URL (exemplo: "introducao-ao-graphql").',
    example: 'introducao-ao-graphql'
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Título do post. Este é o título principal que será exibido no front-end.',
    example: 'Introdução ao GraphQL'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'URL da imagem destacada do post. Esta URL é usada para exibir uma imagem de destaque no post.',
    example: 'url-imagem-destaque-graphql.jpg'
  })
  @IsOptional()
  @IsString()
  featuredImageURL?: string;

  @ApiPropertyOptional({
    description: 'Tempo estimado de leitura do post em minutos.',
    example: 6
  })
  @IsOptional()
  @IsNumber()
  readingTime?: number;

  @ApiPropertyOptional({
    description: 'Status do post, como "publicado" ou "rascunho". Indica o estado atual do post.',
    example: 'published'
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Tags associadas ao post. Usado para categorizar o post e facilitar a busca.',
    example: ['APIs', 'GraphQL', 'Node.js']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Número de visualizações do post. Este campo é atualizado automaticamente com o número de acessos.',
    example: 1800
  })
  @IsOptional()
  @IsNumber()
  views?: number;

  @ApiPropertyOptional({
    description: 'URL canônica do post para SEO.',
    example: 'https://meusite.com/blog/introducao-ao-graphql'
  })
  @IsOptional()
  @IsString()
  canonical?: string;

  @ApiPropertyOptional({
    description: 'Descrição do post para SEO. Uma breve descrição usada para aparecer nos motores de busca.',
    example: 'Aprenda sobre GraphQL, a linguagem de consulta moderna para APIs.'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Palavras-chave para SEO. Termos que ajudam na indexação do conteúdo nos motores de busca.',
    example: ['API moderna', 'Consultas flexíveis', 'GraphQL', 'Node.js']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiProperty({
    description: 'ID concatenado de categoria e subcategoria para busca eficiente no banco.',
    example: '2#3'
  })
  @IsString()
  @IsNotEmpty()
  'categoryId#subcategoryId': string;

  @ApiProperty({
    description: 'ID único do post, utilizado para identificar e acessar o post.',
    example: 'mbx9zi-2b4'
  })
  @IsString()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: 'Data de modificação do post, no formato ISO 8601.',
    example: '2024-10-01T12:00:00Z'
  })
  @IsOptional()
  @IsString()
  modifiedDate?: string;
}
