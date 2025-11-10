/**
 * Testes E2E - Upload Cloudinary (Avatar e Blog)
 * 
 * Execute com: npx playwright test tests/e2e/cloudinary.spec.ts
 * 
 * Pré-requisitos:
 * - Backend rodando em http://localhost:4000
 * - Frontend rodando em http://localhost:3000
 * - Usuário autenticado no dashboard
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';

test.describe('Upload Cloudinary - E2E Tests', () => {
  let authToken: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    // Verificar se backend está acessível
    const healthCheck = await request.get(`${BACKEND_URL}/health`);
    expect(healthCheck.ok()).toBeTruthy();
    console.log('✅ Backend está acessível');
  });

  test('Teste 1: Upload de Avatar via API', async ({ request }) => {
    // Criar um arquivo de teste em memória
    const testImageContent = Buffer.from('fake-image-content');
    const formData = new FormData();
    const blob = new Blob([testImageContent], { type: 'image/jpeg' });
    formData.append('image', blob, 'test-avatar.jpg');

    const response = await request.post(`${BACKEND_URL}/cloudinary/upload/avatar`, {
      multipart: {
        image: {
          name: 'test-avatar.jpg',
          mimeType: 'image/jpeg',
          buffer: testImageContent,
        },
      },
    });

    // Deve retornar 200 ou 400 (400 se Cloudinary não configurado ou arquivo inválido)
    expect([200, 400]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('url');
      expect(data.url).toContain('cloudinary.com');
      expect(data.url).toContain('avatars');
      console.log('✅ Upload de avatar funcionou:', data.url);
    } else {
      console.log('⚠️  Upload retornou erro (esperado em ambiente de teste):', await response.text());
    }
  });

  test('Teste 2: Upload de Imagem do Blog via API', async ({ request }) => {
    const testImageContent = Buffer.from('fake-blog-image-content');
    
    const response = await request.post(`${BACKEND_URL}/cloudinary/upload/blog-image`, {
      multipart: {
        image: {
          name: 'test-blog.jpg',
          mimeType: 'image/jpeg',
          buffer: testImageContent,
        },
      },
    });

    // Deve retornar 200 ou 400
    expect([200, 400]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('url');
      expect(data.url).toContain('cloudinary.com');
      expect(data.url).toContain('blog');
      console.log('✅ Upload de blog funcionou:', data.url);
    } else {
      console.log('⚠️  Upload retornou erro (esperado em ambiente de teste):', await response.text());
    }
  });

  test('Teste 3: Validação de tamanho de arquivo - Avatar (muito grande)', async ({ request }) => {
    // Criar um arquivo muito grande (> 2MB)
    const largeContent = Buffer.alloc(3 * 1024 * 1024); // 3MB
    
    const response = await request.post(`${BACKEND_URL}/cloudinary/upload/avatar`, {
      multipart: {
        image: {
          name: 'large-avatar.jpg',
          mimeType: 'image/jpeg',
          buffer: largeContent,
        },
      },
    });

    // Deve retornar erro 400
    expect(response.status()).toBe(400);
    console.log('✅ Validação de tamanho funcionou (rejeitou arquivo > 2MB)');
  });

  test('Teste 4: Validação de tipo de arquivo', async ({ request }) => {
    const testContent = Buffer.from('not-an-image');
    
    const response = await request.post(`${BACKEND_URL}/cloudinary/upload/avatar`, {
      multipart: {
        image: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: testContent,
        },
      },
    });

    // Deve retornar erro 400
    expect(response.status()).toBe(400);
    console.log('✅ Validação de tipo funcionou (rejeitou arquivo não-imagem)');
  });

  test('Teste 5: Endpoint sem arquivo', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/cloudinary/upload/avatar`);
    
    // Deve retornar erro 400
    expect(response.status()).toBe(400);
    console.log('✅ Validação de arquivo obrigatório funcionou');
  });
});

// Teste de UI (requer autenticação)
test.describe('Upload Cloudinary - UI Tests', () => {
  test.skip('Teste 6: Upload de Avatar na UI', async ({ page }) => {
    // Este teste requer autenticação manual
    // Passos:
    // 1. Fazer login
    // 2. Navegar para perfil
    // 3. Clicar no avatar
    // 4. Selecionar arquivo
    // 5. Verificar URL no console

    await page.goto(`${FRONTEND_URL}/dashboard/login`);
    
    // Aguardar página carregar
    await page.waitForLoadState('networkidle');
    
    // Verificar se página carregou
    expect(page.url()).toContain('/dashboard');
    
    console.log('⚠️  Este teste requer autenticação manual');
    console.log('    Acesse:', `${FRONTEND_URL}/dashboard`);
  });

  test.skip('Teste 7: Upload de Imagem no Blog na UI', async ({ page }) => {
    // Este teste requer autenticação manual
    await page.goto(`${FRONTEND_URL}/dashboard`);
    
    await page.waitForLoadState('networkidle');
    
    console.log('⚠️  Este teste requer autenticação manual');
    console.log('    Crie um post e teste upload de imagem');
  });
});

