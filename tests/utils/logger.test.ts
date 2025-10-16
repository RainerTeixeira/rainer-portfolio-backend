/**
 * Testes Unitários: Logger
 */

import { Logger } from '@nestjs/common';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestContext');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar logger com contexto', () => {
    expect(logger).toBeDefined();
  });

  it('deve fazer log de mensagens', () => {
    const logSpy = jest.spyOn(logger, 'log');
    logger.log('Test message');
    
    expect(logSpy).toHaveBeenCalledWith('Test message');
  });

  it('deve fazer log de erros', () => {
    const errorSpy = jest.spyOn(logger, 'error');
    logger.error('Test error', 'Stack trace');
    
    expect(errorSpy).toHaveBeenCalledWith('Test error', 'Stack trace');
  });

  it('deve fazer log de warnings', () => {
    const warnSpy = jest.spyOn(logger, 'warn');
    logger.warn('Test warning');
    
    expect(warnSpy).toHaveBeenCalledWith('Test warning');
  });

  it('deve fazer log de debug', () => {
    const debugSpy = jest.spyOn(logger, 'debug');
    logger.debug('Test debug');
    
    expect(debugSpy).toHaveBeenCalledWith('Test debug');
  });
});

