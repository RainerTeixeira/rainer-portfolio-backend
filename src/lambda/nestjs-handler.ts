import { APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from '../app.module';
import 'dotenv/config';

let app: any = null;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, new FastifyAdapter());
    
    app.enableCors({
      origin: '*',
      credentials: true,
    });
    
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: 'versioning',
      defaultVersion: '1',
    });
    
    await app.init();
  }
  return app;
}

export async function handler(event: any, _context: Context): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path;
    
    console.log('Incoming request:', { method, path });
    
    if (path === '/health' || path === '/api/v1/health') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
          },
        }),
      };
    }
    
    const nestApp = await bootstrap();
    const fastifyInstance = nestApp.getHttpAdapter().getInstance();
    
    const response = await fastifyInstance.inject({
      method,
      path,
      headers: event.headers,
      body: event.body,
      query: event.queryStringParameters || {},
    });
    
    const headers: Record<string, string> = {};
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }
    
    headers['Access-Control-Allow-Origin'] = '*';
    
    return {
      statusCode: response.statusCode,
      headers,
      body: response.payload || '',
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message,
        stack: error.stack,
      }),
    };
  }
}
