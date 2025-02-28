import { ApiProperty } from '@nestjs/swagger';
import { PostDetailDto } from './post-detail.dto';

export class PostOperationResponseDto {
    @ApiProperty({
        description: 'Indica se a operação foi bem-sucedida',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: 'Dados do post',
        type: PostDetailDto,
        required: false,
    })
    data?: PostDetailDto;

    @ApiProperty({
        description: 'Mensagem de erro, se houver',
        example: 'Erro ao criar post',
        required: false,
    })
    error?: string;
}