import { Handler, Context } from 'aws-lambda';
import { bootstrapServer } from './lambda.bootstrap';
import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Handler principal da Lambda Function URL
 * Processa eventos diretamente com serverless-express
 */
export const handler: Handler = async (
  event: any,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    // Inicializa o servidor NestJS (reutiliza se existir)
    const server = await bootstrapServer();
    
    // Usa o serverless-express para processar o evento
    const result = await new Promise<APIGatewayProxyResult>((resolve, reject) => {
      const handler = server as any;
      handler(event, context, (error: Error, response: APIGatewayProxyResult) => {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    });
    
    return result;
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
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
