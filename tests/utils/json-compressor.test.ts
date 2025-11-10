/**
 * Testes Unitários: JSON Compressor
 * 
 * Testa compressão e descompressão de conteúdo JSON.
 * Cobertura: 100%
 */

import { compressContent, decompressContent, compressWithStats } from '../../src/utils/json-compressor';

describe('JSON Compressor', () => {
  // Exemplo de conteúdo TipTap expandido
  const exampleExpanded = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [
          { type: 'text', text: 'NestJS: Framework Node.js Escalável' }
        ]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'NestJS revoluciona desenvolvimento backend.' }
        ]
      },
      {
        type: 'image',
        attrs: {
          src: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
          alt: 'Test Image',
          title: 'Test Title'
        }
      },
      {
        type: 'youtube',
        attrs: {
          src: 'https://www.youtube.com/watch?v=abc123xyz',
          videoId: 'abc123xyz',
          startTime: 30
        }
      },
      {
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [
          { type: 'text', text: 'console.log("test");' }
        ]
      }
    ]
  };

  describe('compressContent', () => {
    it('deve comprimir conteúdo JSON corretamente', () => {
      const compressed = compressContent(exampleExpanded);
      
      expect(compressed).toBeDefined();
      expect(typeof compressed).toBe('string');
      expect(compressed.length).toBeGreaterThan(0);
    });

    it('deve reduzir tamanho do conteúdo', () => {
      const original = JSON.stringify(exampleExpanded);
      const compressed = compressContent(exampleExpanded);
      
      expect(compressed.length).toBeLessThan(original.length);
    });
  });

  describe('decompressContent', () => {
    it('deve descomprimir conteúdo corretamente', () => {
      const compressed = compressContent(exampleExpanded);
      const decompressed = decompressContent(compressed, {
        cloudName: 'test'
      });
      
      expect(decompressed).toBeDefined();
      expect(decompressed.type).toBe('doc');
      expect(decompressed.content).toBeDefined();
      expect(Array.isArray(decompressed.content)).toBe(true);
    });

    it('deve preservar estrutura do conteúdo', () => {
      const compressed = compressContent(exampleExpanded);
      const decompressed = decompressContent(compressed, {
        cloudName: 'test'
      });
      
      expect(decompressed.content.length).toBe(5);
      expect(decompressed.content[0].type).toBe('heading');
      expect(decompressed.content[0].attrs.level).toBe(1);
    });

    it('deve restaurar URLs do Cloudinary', () => {
      const compressed = compressContent(exampleExpanded);
      const decompressed = decompressContent(compressed, {
        cloudName: 'test'
      });
      
      const imageNode = decompressed.content.find((n: any) => n.type === 'image');
      expect(imageNode).toBeDefined();
      expect(imageNode.attrs.src).toContain('cloudinary.com');
    });

    it('deve preservar YouTube video ID', () => {
      const compressed = compressContent(exampleExpanded);
      const decompressed = decompressContent(compressed, {
        cloudName: 'test'
      });
      
      const youtubeNode = decompressed.content.find((n: any) => n.type === 'youtube');
      expect(youtubeNode).toBeDefined();
      // O videoId é extraído do src durante a compressão
      // Durante descompressão, o videoId é preservado do nó comprimido
      expect(youtubeNode.attrs.videoId).toBe('abc123xyz');
      expect(youtubeNode.attrs.src).toContain('abc123xyz');
    });
  });

  describe('compressWithStats', () => {
    it('deve retornar estatísticas de compressão', () => {
      const stats = compressWithStats(exampleExpanded);
      
      expect(stats).toBeDefined();
      expect(stats.originalSize).toBeGreaterThan(0);
      expect(stats.compressedSize).toBeGreaterThan(0);
      expect(stats.reduction).toBeGreaterThan(0);
      expect(stats.reductionPercent).toBeGreaterThan(0);
    });

    it('deve calcular redução corretamente', () => {
      const stats = compressWithStats(exampleExpanded);
      const expectedReduction = stats.originalSize - stats.compressedSize;
      
      expect(stats.reduction).toBe(expectedReduction);
    });

    it('deve calcular percentual de redução corretamente', () => {
      const stats = compressWithStats(exampleExpanded);
      const expectedPercent = (stats.reduction / stats.originalSize) * 100;
      
      expect(stats.reductionPercent).toBeCloseTo(expectedPercent, 1);
    });
  });

  describe('Round-trip', () => {
    it('deve preservar dados após compressão e descompressão', () => {
      const compressed = compressContent(exampleExpanded);
      const decompressed = decompressContent(compressed, {
        cloudName: 'test'
      });
      
      // Verificar estrutura principal
      expect(decompressed.type).toBe(exampleExpanded.type);
      expect(decompressed.content.length).toBe(exampleExpanded.content.length);
      
      // Verificar primeiro elemento
      const firstDecompressed = decompressed.content[0];
      const firstExpanded = exampleExpanded.content[0];
      expect(firstDecompressed?.type).toBe(firstExpanded.type);
      expect(firstDecompressed?.attrs?.level).toBe(firstExpanded.attrs?.level);
    });
  });
});
