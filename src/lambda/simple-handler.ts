import { APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from '../app.module';

let app: any = null;
let server: any = null;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, new FastifyAdapter());
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: 'versioning',
      defaultVersion: '1',
    });
    await app.init();
    server = app.getHttpAdapter().getInstance();
  }
  return server;
}

export async function handler(event: any, _context: Context): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path;
    
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
    
    const fastifyServer = await bootstrap();
    
    const response = await fastifyServer.inject({
      method,
      path,
      headers: event.headers,
      body: event.body,
      query: event.queryStringParameters,
    });
    
    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.payload,
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
      }),
    };
  }
}
