import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthorDto } from './create-author.dto';

export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {
    @IsNotEmpty()
    updated_at: string = new Date().toISOString();
}