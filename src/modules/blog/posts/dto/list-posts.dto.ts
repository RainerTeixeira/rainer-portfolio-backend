import { ApiProperty } from '@nestjs/swagger';
import { PostBaseDto } from './post-base.dto';

export class MetaDto {
  @ApiProperty()
  count: number;

  @ApiPropertyOptional()
  totalPages?: number;

  @ApiPropertyOptional()
  nextCursor?: string | null;
}

export class ListPostsDto {
  @ApiProperty({ type: () => [PostBaseDto] })
  data: PostBaseDto[];

  @ApiProperty()
  meta: MetaDto;
}