import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryDto {
    @ApiProperty()
    readonly categoryId: number;

    @ApiProperty()
    readonly subCategoryId: number;
}

export class ReferenceDto {
    @ApiProperty()
    readonly referenceId: number;

    @ApiProperty()
    readonly title: string;

    @ApiProperty()
    readonly url: string;
}

export class SectionDto {
    @ApiProperty()
    readonly sectionId: number;

    @ApiProperty()
    readonly title: string;

    @ApiProperty()
    readonly content: string;

    @ApiProperty()
    readonly type: string;
}

export class SeoDto {
    @ApiProperty()
    readonly canonicalUrl: string;

    @ApiProperty()
    readonly description: string;

    @ApiProperty()
    readonly keywords: string[];
}

export class PostBaseDto {
    @ApiProperty()
    readonly postId: number;

    @ApiProperty({ type: Date })
    readonly postDate: Date;

    @ApiProperty({ type: [Number] })
    readonly authorIds: number[];

    @ApiProperty()
    readonly category: CategoryDto;

    @ApiPropertyOptional({ type: [Number] })
    readonly comments?: number[];

    @ApiPropertyOptional({ type: [Number] })
    readonly externalIntegrations?: number[];

    @ApiProperty()
    readonly postContent: string;

    @ApiProperty({ type: [String] })
    readonly postImages: string[];

    @ApiProperty({ type: Date })
    readonly postLastUpdated: Date;

    @ApiProperty()
    readonly postReadingTime: number;

    @ApiProperty()
    readonly postStatus: number;

    @ApiProperty()
    readonly postSummary: string;

    @ApiProperty({ type: [String] })
    readonly postTags: string[];

    @ApiProperty()
    readonly postTitle: string;

    @ApiPropertyOptional({ type: [String] })
    readonly postVideoEmbedUrls?: string[];

    @ApiPropertyOptional({ type: [ReferenceDto] })
    readonly references?: ReferenceDto[];

    @ApiPropertyOptional({ type: [Number] })
    readonly relatedPosts?: number[];

    @ApiPropertyOptional({ type: [SectionDto] })
    readonly sections?: SectionDto[];

    @ApiProperty()
    readonly seo: SeoDto;

    @ApiProperty()
    readonly viewsCount: number;
}