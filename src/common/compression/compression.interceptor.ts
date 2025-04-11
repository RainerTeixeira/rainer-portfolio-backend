// src/common/interceptors/compression.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import zlib from 'zlib';

@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      map(data => {
        response.setHeader('Content-Encoding', 'gzip');
        return zlib.gzipSync(JSON.stringify(data));
      })
    );
  }
}