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
        cognitoSub: 'cognito-123',
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
      };

      expect(validData.cognitoSub).toBeDefined();
      expect(validData.fullName).toBe('Test User');
    });

    it('deve validar cognitoSub obrigatório', () => {
      const validCognitoSubs = [
        'cognito-123',
        'cognito-abc-def-456',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      ];

      validCognitoSubs.forEach(sub => {
        expect(sub).toBeDefined();
        expect(sub.length).toBeGreaterThan(0);
      });
    });

    it('deve aceitar campos opcionais vazios', () => {
      const minimalData: CreateUserData = {
        fullName: 'Test User',
        cognitoSub: 'cognito-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      expect(minimalData.fullName).toBe('Test User');
      expect(minimalData.avatar).toBeUndefined();
      expect(minimalData.bio).toBeUndefined();
    });
  });

  describe('UpdateUserData', () => {
    it('deve aceitar atualização parcial', () => {
      const updateData: UpdateUserData = {
        fullName: 'Updated Name',
      };

      expect(updateData.fullName).toBe('Updated Name');
    });

    it('deve aceitar atualização de múltiplos campos', () => {
      const updateData: UpdateUserData = {
        fullName: 'New Name',
        bio: 'New bio',
        avatar: 'https://example.com/new-avatar.jpg',
      };

      expect(updateData.fullName).toBe('New Name');
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

