import { IsString, IsNumber, IsNotEmpty, ValidateNested, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class ContentPostDto {
    @IsString()
    @IsNotEmpty()
    html: string;

    @IsNumber()
    @IsNotEmpty()
    readingTime: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SectionPostDto)
    sections: SectionPostDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReferencePostDto)
    references: ReferencePostDto[];
}

class SectionPostDto {
    @IsString()
    @IsNotEmpty()
    anchor: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    type: string;
}

class ReferencePostDto {
    @IsString()
    @IsNotEmpty()
    author: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    url: string;
}

class SeoPostDto {
    @IsString()
    @IsNotEmpty()
    canonicalUrl: string;

    @IsArray()
    @IsString({ each: true })
    keywords: string[];

    @IsString()
    @IsNotEmpty()
    metaDescription: string;

    @IsString()
    @IsNotEmpty()
    title: string;
}

class MediaPostDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImagePostDto)
    images: ImagePostDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VideoPostDto)
    videos: VideoPostDto[];
}

class ImagePostDto {
    @IsString()
    @IsNotEmpty()
    alt: string;

    @IsString()
    @IsNotEmpty()
    url: string;
}

class VideoPostDto {
    @IsString()
    @IsNotEmpty()
    embedUrl: string;

    @IsString()
    @IsNotEmpty()
    thumbnail: string;
}

class EngagementPostDto {
    @IsNumber()
    @IsNotEmpty()
    avgTimeOnPage: number;

    @IsNumber()
    @IsNotEmpty()
    socialShares: number;

    @IsNumber()
    @IsNotEmpty()
    views: number;
}


export class PostDto {
    @IsNumber()
    postId: number;

    @IsString()
    @IsNotEmpty()
    postDate: string;

    @ValidateNested()
    @Type(() => ContentPostDto)
    content: ContentPostDto;

    @IsString()
    @IsNotEmpty()
    dateModified: string;

    @ValidateNested()
    @Type(() => EngagementPostDto)
    engagement: EngagementPostDto;

    @ValidateNested()
    @Type(() => MediaPostDto)
    media: MediaPostDto;

    @ValidateNested()
    @Type(() => SeoPostDto)
    seo: SeoPostDto;

    @IsString()
    @IsNotEmpty()
    slug: string;
}