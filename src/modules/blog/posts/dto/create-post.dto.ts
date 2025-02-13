import { IsString, IsNumber, IsNotEmpty, ValidateNested, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class CreateContentPostDto {
    @IsString()
    @IsNotEmpty()
    html: string;

    @IsNumber()
    @IsNotEmpty()
    readingTime: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSectionPostDto)
    sections: CreateSectionPostDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateReferencePostDto)
    references: CreateReferencePostDto[];
}

class CreateSectionPostDto {
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

class CreateReferencePostDto {
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

class CreateSeoPostDto {
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

class CreateMediaPostDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateImagePostDto)
    images: CreateImagePostDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateVideoPostDto)
    videos: CreateVideoPostDto[];
}

class CreateImagePostDto {
    @IsString()
    @IsNotEmpty()
    alt: string;

    @IsString()
    @IsNotEmpty()
    url: string;
}

class CreateVideoPostDto {
    @IsString()
    @IsNotEmpty()
    embedUrl: string;

    @IsString()
    @IsNotEmpty()
    thumbnail: string;
}

class CreateEngagementPostDto {
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


export class CreatePostDto {
    @ValidateNested()
    @Type(() => CreateContentPostDto)
    content: CreateContentPostDto;

    @ValidateNested()
    @Type(() => CreateEngagementPostDto)
    engagement: CreateEngagementPostDto;

    @ValidateNested()
    @Type(() => CreateMediaPostDto)
    media: CreateMediaPostDto;

    @ValidateNested()
    @Type(() => CreateSeoPostDto)
    seo: CreateSeoPostDto;

    @IsString()
    @IsNotEmpty()
    slug: string;
}