declare module '@fastify/compress' {
  import { FastifyPluginCallback } from 'fastify';

  const fastifyCompress: FastifyPluginCallback<{
    global?: boolean;
    threshold?: number;
    brotliOptions?: Record<string, unknown>;
    zlibOptions?: Record<string, unknown>;
  }>;

  export default fastifyCompress;
}
