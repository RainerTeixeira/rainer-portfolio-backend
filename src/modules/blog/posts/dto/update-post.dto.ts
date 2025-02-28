import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @ApiProperty({
        description: 'ID do post a ser atualizado',
        example: '550e8400-e29b-41d4-a716-446655440003',
    })
    @IsUUID()
    @IsNotEmpty()
    postId: string;
}