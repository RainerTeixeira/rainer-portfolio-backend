declare module 'aws-serverless-express' {
    import * as express from 'express';
    import { Handler } from 'aws-lambda';

    export function createServer(app: express.Express): any;
    export function proxy(server: any, event: any, context: any, statusCode: string): any;
}
