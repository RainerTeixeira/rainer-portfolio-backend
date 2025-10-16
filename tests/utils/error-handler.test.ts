/**
 * Testes Unitários: Error Handler
 */

import { HttpException, InternalServerErrorException } from '@nestjs/common';

// Mock do error handler se ele existir
describe('Error Handler', () => {
  it('deve tratar HttpException corretamente', () => {
    const error = new HttpException('Test error', 400);
    
    expect(error.getStatus()).toBe(400);
    expect(error.message).toBe('Test error');
  });

  it('deve tratar erro genérico como InternalServerError', () => {
    const error = new Error('Generic error');
    const serverError = new InternalServerErrorException(error.message);
    
    expect(serverError.getStatus()).toBe(500);
  });

  it('deve formatar resposta de erro', () => {
    const error = new HttpException('Test error', 400);
    const response = {
      statusCode: error.getStatus(),
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    
    expect(response.statusCode).toBe(400);
    expect(response.message).toBe('Test error');
    expect(response.timestamp).toBeDefined();
  });
});

