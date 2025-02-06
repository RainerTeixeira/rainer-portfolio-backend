import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {
    // Adicionando assinatura de índice para garantir que podemos acessar campos dinamicamente
    [key: string]: string | number | undefined;
}
