import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, query, body, params } = request;
    const userAgent = request.get('user-agent') || '';

    // Log the request incoming
    this.logger.log(`Incoming: ${method} ${originalUrl}`);
    if (Object.keys(query).length) {
      this.logger.debug(`Query: ${JSON.stringify(query)}`);
    }
    if (Object.keys(params).length) {
      this.logger.debug(`Params: ${JSON.stringify(params)}`);
    }
    if (Object.keys(body).length) {
      this.logger.debug(`Body: ${JSON.stringify(body)}`);
    }

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      this.logger.log(
        `Response: ${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent}`,
      );
    });

    next();
  }
}
