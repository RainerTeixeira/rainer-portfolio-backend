// src/common/dto/base.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';

export class BaseDto {
    [key: string]: any;
}