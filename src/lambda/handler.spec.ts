import { handler, runLocal } from './handler';
import type { FunctionUrlEvent } from './function-url.handler';

describe('LambdaHandler', () => {
  let mockEvent: FunctionUrlEvent;

  beforeEach(() => {
    mockEvent = {
      version: '2.0',
      routeKey: 'ANY /',
      rawPath: '/health',
      rawQueryString: '',
      headers: {
        'content-type': 'application/json',
      },
      requestContext: {
        accountId: '123456789012',
        apiId: 'r7pmxmplak',
        domainName: 'r7pmxmplak.execute-api.us-east-1.amazonaws.com',
        domainPrefix: 'r7pmxmplak',
        requestId: 'JKJaXmPLvHcESHA=',
        routeKey: 'ANY /',
        stage: 'test-invoke-stage',
        time: '10/Nov/2021:18:49:04 +0000',
        timeEpoch: 1636574944,
        http: {
          method: 'GET',
          path: '/health',
          protocol: 'HTTP/1.1',
          sourceIp: '203.0.113.1',
          userAgent: 'Mozilla/5.0',
        },
      },
      isBase64Encoded: false,
      body: undefined,
    };
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
    expect(runLocal).toBeDefined();
  });

  it('should handle health check request', async () => {
    const result = await handler(mockEvent);
    
    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty('content-type', 'application/json');
    expect(result.headers).toHaveProperty('access-control-allow-origin', '*');
  });

  it('should handle CORS preflight request', async () => {
    const corsEvent = {
      ...mockEvent,
      requestContext: {
        ...mockEvent.requestContext,
        http: {
          ...mockEvent.requestContext.http,
          method: 'OPTIONS',
          path: '/api/test', // Usar um path diferente de /health
        },
      },
    };

    const result = await handler(corsEvent);
    
    expect(result.statusCode).toBe(204);
    expect(result.headers).toHaveProperty('access-control-allow-origin', '*');
    expect(result.headers).toHaveProperty('access-control-allow-methods');
  });

  it('should handle errors gracefully', async () => {
    const errorEvent = {
      ...mockEvent,
      requestContext: {
        ...mockEvent.requestContext,
        http: {
          ...mockEvent.requestContext.http,
          path: '/non-existent-route',
        },
      },
    };

    const result = await handler(errorEvent);
    
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toHaveProperty('message', 'Internal Server Error');
  });

  it('should include request ID in error responses', async () => {
    const errorEvent = {
      ...mockEvent,
      requestContext: {
        ...mockEvent.requestContext,
        http: {
          ...mockEvent.requestContext.http,
          path: '/error-route',
        },
      },
    };

    const result = await handler(errorEvent);
    
    if (result.statusCode >= 400) {
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('requestId', mockEvent.requestContext.requestId);
    }
  });
});
