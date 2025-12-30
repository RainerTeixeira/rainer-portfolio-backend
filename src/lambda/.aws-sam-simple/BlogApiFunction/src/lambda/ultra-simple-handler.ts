import { APIGatewayProxyResultV2, Context } from 'aws-lambda';

export async function handler(event: any, context: Context): Promise<APIGatewayProxyResultV2> {
  try {
    const method = event.requestContext?.http?.method || event.httpMethod;
    const path = event.rawPath || event.path;
    
    console.log('Event:', JSON.stringify(event, null, 2));
    
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
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'API is running',
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
      }),
    };
  }
}
