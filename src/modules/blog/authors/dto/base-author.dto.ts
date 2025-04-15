export class BaseAuthorDto {
    // Chave primária: "AUTHOR#id" (S)
    authorId: string;
    // Chave de classificação: "PROFILE" (S)
    profile: string;
    bio: string;
    created_at: string;
    email: string;
    meta_description: string;
    name: string;
    profile_picture_url: string;
    slug: string;
    // social_links deverá seguir o formato validado pelo decorator customizado
    social_links: Record<string, { S: string }>;
    type: string; // ex: "AUTHOR"
    updated_at: string;
}
