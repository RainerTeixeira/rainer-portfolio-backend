// src/modules/authors/entities/author.entity.ts
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AuthorEntity {
  @Expose()
  pk: string; // AUTHOR#id

  @Expose()
  sk: string = 'PROFILE';

  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  slug: string;

  @Expose()
  bio: string;

  @Expose()
  profile_picture_url: string;

  @Expose()
  meta_description: string;

  @Expose()
  social_links: Record<string, string>;

  @Expose()
  created_at: string;

  @Expose()
  updated_at: string;

  @Expose()
  type: string = 'AUTHOR';

  constructor(partial: Partial<AuthorEntity>) {
    Object.assign(this, partial);
    this.pk = `AUTHOR#${this.id}`;
  }
}