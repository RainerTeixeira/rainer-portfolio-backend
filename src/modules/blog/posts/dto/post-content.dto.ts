import { ApiProperty } from '@nestjs/swagger';
import { PostDetailDto } from './post-detail.dto';
import { PostSummaryDto } from './blog-summary.dto';
import { SeoMetadataDto } from './seo-metadata.dto';

export class PostContentDto extends PostDetailDto {
    @ApiProperty({
        description: 'Posts relacionados',
        type: [PostSummaryDto],
    })
    relatedPosts: PostSummaryDto[];

    @ApiProperty({
        description: 'Metadados do post',
        type: 'object',
        properties: {
            seo: { $ref: '#/components/schemas/SeoMetadataDto' },
            readingTime: { type: 'number', example: 5 },
        },
    })
    metadata: {
        seo: SeoMetadataDto;
        readingTime: number;
    };
}