import { Controller, Get, Post, Body, Put, Param, Delete, ValidationPipe } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { AuthorDto } from './dto/author.dto';

@Controller('blog/authors') // Rota base para autores
export class AuthorsController {
    constructor(private readonly authorsService: AuthorsService) { }

    @Post()
    async create(@Body(new ValidationPipe()) createAuthorDto: CreateAuthorDto): Promise<AuthorDto> {
        return this.authorsService.create(createAuthorDto);
    }

    @Get()
    async findAll(): Promise<AuthorDto[]> {
        return this.authorsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<AuthorDto> {
        return this.authorsService.findOne(+id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body(new ValidationPipe()) updateAuthorDto: UpdateAuthorDto,
    ): Promise<AuthorDto> {
        return this.authorsService.update(+id, updateAuthorDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.authorsService.remove(+id);
    }
}