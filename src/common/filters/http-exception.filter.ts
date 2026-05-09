import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const normalized = this.normalizeHttpException(payload, status);
      response.status(status).json(normalized);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }

  private normalizeHttpException(
    payload: string | object,
    status: number,
  ): Record<string, unknown> {
    if (typeof payload === 'string') {
      return {
        statusCode: status,
        message: payload,
        error: this.getErrorLabel(status),
      };
    }

    const body = payload as Record<string, unknown>;
    return {
      statusCode: status,
      message: body.message ?? this.getErrorLabel(status),
      error:
        typeof body.error === 'string' ? body.error : this.getErrorLabel(status),
    };
  }

  private getErrorLabel(status: number) {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      default:
        return 'Error';
    }
  }
}
