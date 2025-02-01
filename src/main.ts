import { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Welcome to Rainer Portfolio API',
      endpoints: {
        posts: '/posts',
        authors: '/authors',
        categories: '/categories',
        comments: '/comments'
      }
    })
  };
};