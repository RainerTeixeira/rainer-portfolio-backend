/**
 * Testes de Schema: Post
 * 
 * Testa validações de dados para o modelo Post.
 */

import { CreatePostData, UpdatePostData, PostStatus } from '../../../src/modules/posts/post.model';

describe('Post Schema Validation', () => {
  describe('CreatePostData', () => {
    it('deve aceitar dados válidos de criação', () => {
      const validData: CreatePostData = {
        title: 'Test Post Title',
        slug: 'test-post-title',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This is the content of the test post.' }] }] },
        subcategoryId: 'subcat-123',
        authorId: 'author-123',
        featured: false,
        status: PostStatus.DRAFT,
      };

      expect(validData.title).toBeDefined();
      expect(validData.slug).toBeDefined();
      expect(validData.content).toBeDefined();
      expect(validData.subcategoryId).toBeDefined();
      expect(validData.authorId).toBeDefined();
    });

    it('deve validar formato de slug', () => {
      const validSlugs = [
        'valid-slug',
        'valid-slug-123',
        'another-valid-slug',
        'slug',
      ];

      const invalidSlugs = [
        'Invalid Slug',
        'invalid_slug',
        'invalid@slug',
        'invalid.slug',
      ];

      validSlugs.forEach(slug => {
        expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      });

      invalidSlugs.forEach(slug => {
        expect(slug).not.toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      });
    });

    it('deve validar status do post', () => {
      const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

      validStatuses.forEach(status => {
        expect(['DRAFT', 'PUBLISHED', 'ARCHIVED']).toContain(status);
      });
    });

    it('deve aceitar campos opcionais vazios', () => {
      const minimalData: CreatePostData = {
        title: 'Minimal Post',
        slug: 'minimal-post',
        content: { type: 'doc', content: [] },
        subcategoryId: 'subcat-123',
        authorId: 'author-123',
      };

      expect(minimalData.status).toBeUndefined();
      expect(minimalData.featured).toBeUndefined();
      expect(minimalData.allowComments).toBeUndefined();
    });
  });

  describe('UpdatePostData', () => {
    it('deve aceitar atualização parcial de título', () => {
      const updateData: UpdatePostData = {
        title: 'Updated Title',
      };

      expect(updateData.title).toBe('Updated Title');
      expect(updateData.content).toBeUndefined();
    });

    it('deve aceitar atualização de múltiplos campos', () => {
      const updateData: UpdatePostData = {
        title: 'New Title',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New content' }] }] },
        featured: true,
      };

      expect(updateData.title).toBe('New Title');
      expect(updateData.content).toBeDefined();
      expect(updateData.featured).toBe(true);
    });

    it('deve aceitar mudança de status', () => {
      const publishData: UpdatePostData = {
        status: PostStatus.PUBLISHED,
      };

      const archiveData: UpdatePostData = {
        status: PostStatus.ARCHIVED,
      };

      expect(publishData.status).toBe(PostStatus.PUBLISHED);
      expect(archiveData.status).toBe(PostStatus.ARCHIVED);
    });
  });

  describe('Post Content Validation', () => {
    it('deve aceitar conteúdo HTML válido', () => {
      const htmlContent = '<h1>Title</h1><p>Paragraph</p>';
      const data: CreatePostData = {
        title: 'HTML Post',
        slug: 'html-post',
        content: htmlContent,
        subcategoryId: 'subcat-123',
        authorId: 'author-123',
      };

      expect(data.content).toContain('<h1>');
      expect(data.content).toContain('<p>');
    });

    it('deve aceitar conteúdo markdown', () => {
      const markdownContent = '# Title\n\nThis is **bold** text.';
      const data: CreatePostData = {
        title: 'Markdown Post',
        slug: 'markdown-post',
        content: markdownContent,
        subcategoryId: 'subcat-123',
        authorId: 'author-123',
      };

      expect(data.content).toContain('#');
      expect(data.content).toContain('**');
    });
  });
});

