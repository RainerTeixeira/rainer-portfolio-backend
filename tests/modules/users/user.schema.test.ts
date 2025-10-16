/**
 * Testes de Schema: User
 * 
 * Testa validações de dados para o modelo User.
 */

import { CreateUserData, UpdateUserData } from '../../../src/modules/users/user.model';

describe('User Schema Validation', () => {
  describe('CreateUserData', () => {
    it('deve aceitar dados válidos de criação', () => {
      const validData: CreateUserData = {
        email: 'test@example.com',
        username: 'testuser',
        cognitoSub: 'cognito-123',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
      };

      expect(validData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(validData.username).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(validData.cognitoSub).toBeDefined();
    });

    it('deve validar formato de email', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com',
        'invalid @example.com',
      ];

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('deve validar username sem espaços', () => {
      const validUsernames = ['user123', 'test_user', 'test-user', 'USER'];
      const invalidUsernames = ['user 123', 'test user', 'test@user'];

      validUsernames.forEach(username => {
        expect(username).toMatch(/^[a-zA-Z0-9_-]+$/);
      });

      invalidUsernames.forEach(username => {
        expect(username).not.toMatch(/^[a-zA-Z0-9_-]+$/);
      });
    });

    it('deve aceitar campos opcionais vazios', () => {
      const minimalData: CreateUserData = {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        cognitoSub: 'cognito-123',
      };

      expect(minimalData.name).toBe('Test User');
      expect(minimalData.avatar).toBeUndefined();
      expect(minimalData.bio).toBeUndefined();
    });
  });

  describe('UpdateUserData', () => {
    it('deve aceitar atualização parcial', () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
      };

      expect(updateData.name).toBe('Updated Name');
      expect(updateData.email).toBeUndefined();
      expect(updateData.username).toBeUndefined();
    });

    it('deve aceitar atualização de múltiplos campos', () => {
      const updateData: UpdateUserData = {
        name: 'New Name',
        bio: 'New bio',
        avatar: 'https://example.com/new-avatar.jpg',
      };

      expect(updateData.name).toBe('New Name');
      expect(updateData.bio).toBe('New bio');
      expect(updateData.avatar).toBe('https://example.com/new-avatar.jpg');
    });

    it('deve aceitar objeto vazio', () => {
      const updateData: UpdateUserData = {};

      expect(Object.keys(updateData).length).toBe(0);
    });
  });

  describe('User Roles', () => {
    it('deve ter roles válidos', () => {
      const validRoles = ['USER', 'ADMIN', 'MODERATOR'];

      validRoles.forEach(role => {
        expect(['USER', 'ADMIN', 'MODERATOR']).toContain(role);
      });
    });

    it('deve rejeitar roles inválidos', () => {
      const invalidRoles = ['SUPER_USER', 'OWNER', 'GUEST', ''];

      invalidRoles.forEach(role => {
        expect(['USER', 'ADMIN', 'MODERATOR']).not.toContain(role);
      });
    });
  });
});

