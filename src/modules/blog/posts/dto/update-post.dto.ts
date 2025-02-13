import { IsString, IsNumber, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateContentPostDto {
    @IsOptional()
    @IsString()
    html?: string;

    @IsOptional()
    @IsNumber()
    readingTime?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateSectionPostDto)
    sections?: UpdateSectionPostDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateReferencePostDto)
    references?: UpdateReferencePostDto[];
}

class UpdateSectionPostDto {
    @IsOptional()
    @IsString()
    anchor?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    type?: string;
}

class UpdateReferencePostDto {
    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    url?: string;
}

class UpdateSeoPostDto {
    @IsOptional()
    @IsString()
    canonicalUrl?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];

    @IsOptional()
    @IsString()
    metaDescription?: string;

    @IsOptional()
    @IsString()
    title?: string;
}

class UpdateMediaPostDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateImagePostDto)
    images?: UpdateImagePostDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateVideoPostDto)
    videos?: UpdateVideoDto[];
}

class UpdateImagePostDto {
    @IsOptional()
    @IsString()
    alt?: string;

    @IsOptional()
    @IsString()
    url?: string;
}

class UpdateVideoDto {
    @IsOptional()
    @IsString()
    embedUrl?: string;

    @IsOptional()
    @IsString()
    thumbnail?: string;
}

class UpdateEngagementPostDto {
    @IsOptional()
    @IsNumber()
    avgTimeOnPage?: number;

    @IsOptional()
    @IsNumber()
    socialShares?: number;

    @IsOptional()
    @IsNumber()
    views?: number;
}

export class UpdatePostDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateContentPostDto)
    content?: UpdateContentPostDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateEngagementPostDto)
    engagement?: UpdateEngagementPostDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateMediaPostDto)
    media?: UpdateMediaPostDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateSeoPostDto)
    seo?: UpdateSeoPostDto;

    @IsOptional()
    @IsString()
    slug?: string;
}