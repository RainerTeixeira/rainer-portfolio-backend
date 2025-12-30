import { APIGatewayProxyResultV2, Context } from 'aws-lambda';
import 'dotenv/config';

export async function handler(event: any, context: Context): Promise<APIGatewayProxyResultV2> {
  try {
    console.log('=== HANDLER START ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_PROVIDER: process.env.DATABASE_PROVIDER,
      DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT
    });
    
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path;
    
    console.log('Request:', { method, path });
    
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
    
    if (path === '/api/v1/posts' && method === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'post-1',
              title: 'Introdução ao NestJS',
              slug: 'introducao-ao-nestjs',
              content: 'NestJS é um framework para construir aplicações Node.js server-side eficientes...',
              excerpt: 'Aprenda os conceitos básicos do NestJS',
              published: true,
              featured: true,
              authorId: 'user-123',
              categoryId: 'cat-1',
              tags: ['nestjs', 'nodejs', 'backend'],
              readingTime: 5,
              viewCount: 150,
              likeCount: 25,
              commentCount: 5,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        }),
      };
    }
    
    if (path === '/api/v1/users' && method === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: [
            {
              cognitoSub: 'user-123',
              email: 'joao@example.com',
              name: 'João Silva',
              nickname: 'João',
              role: 'AUTHOR',
              bio: 'Desenvolvedor Full Stack',
              website: 'https://joaosilva.dev',
              avatar: 'https://picsum.photos/200/200',
              socialLinks: {
                github: 'https://github.com/joaosilva',
                linkedin: 'https://linkedin.com/in/joaosilva'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }),
      };
    }
    
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Not Found',
        path: path,
        method: method,
      }),
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
