import { APIGatewayProxyResultV2, Context } from 'aws-lambda';
import 'dotenv/config';

const mockData = {
  users: [
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
  ],
  posts: [
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
      updatedAt: new Date().toISOString(),
      author: {
        cognitoSub: 'user-123',
        name: 'João Silva',
        nickname: 'João',
        avatar: 'https://picsum.photos/200/200'
      },
      category: {
        id: 'cat-1',
        name: 'Backend',
        slug: 'backend',
        color: '#3B82F6'
      }
    },
    {
      id: 'post-2',
      title: 'DynamoDB com Serverless',
      slug: 'dynamodb-com-serverless',
      content: 'DynamoDB é um banco NoSQL totalmente gerenciado que oferece performance escalável...',
      excerpt: 'Como usar DynamoDB em arquiteturas serverless',
      published: true,
      featured: false,
      authorId: 'user-123',
      categoryId: 'cat-2',
      tags: ['dynamodb', 'aws', 'serverless'],
      readingTime: 8,
      viewCount: 89,
      likeCount: 12,
      commentCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        cognitoSub: 'user-123',
        name: 'João Silva',
        nickname: 'João',
        avatar: 'https://picsum.photos/200/200'
      },
      category: {
        id: 'cat-2',
        name: 'Cloud',
        slug: 'cloud',
        color: '#10B981'
      }
    }
  ],
  categories: [
    {
      id: 'cat-1',
      name: 'Backend',
      slug: 'backend',
      description: 'Artigos sobre desenvolvimento backend',
      color: '#3B82F6',
      icon: 'server',
      postCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cat-2',
      name: 'Cloud',
      slug: 'cloud',
      description: 'Artigos sobre serviços em nuvem',
      color: '#10B981',
      icon: 'cloud',
      postCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

export async function handler(event: any, context: Context): Promise<APIGatewayProxyResultV2> {
  try {
    console.log('=== HANDLER START ===');
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path;
    
    console.log('Request:', { method, path });
    
    // CORS
    if (method === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
        },
        body: '',
      };
    }
    
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
          data: mockData.posts,
          pagination: {
            page: 1,
            limit: 10,
            total: mockData.posts.length,
            totalPages: 1
          }
        }),
      };
    }
    
    if (path.startsWith('/api/v1/posts/') && method === 'GET') {
      const slug = path.split('/').pop();
      const post = mockData.posts.find(p => p.slug === slug);
      
      if (!post) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            message: 'Post not found',
          }),
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: post,
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
          data: mockData.users,
        }),
      };
    }
    
    if (path === '/api/v1/categories' && method === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: mockData.categories,
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
