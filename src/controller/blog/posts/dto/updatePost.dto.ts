// src/controller/blog/posts/dto/updatePost.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './createPost.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) { }
