import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<
      Request & { route?: { path?: string } }
    >();
    const response = httpContext.getResponse<{ statusCode?: number }>();
    const method = (request.method || 'UNKNOWN').toUpperCase();
    const path = this.normalizePath(request);

    const stopTimer = this.requestDuration.startTimer();

    return next.handle().pipe(
      tap({
        next: () =>
          this.trackMetrics(method, path, response.statusCode, stopTimer),
        error: () =>
          this.trackMetrics(
            method,
            path,
            response.statusCode ?? 500,
            stopTimer,
          ),
      }),
    );
  }

  private trackMetrics(
    method: string,
    path: string,
    statusCode = 200,
    stopTimer: (labels?: Record<string, string>) => void,
  ) {
    const labels = {
      method,
      path,
      status: String(statusCode),
    };

    this.requestCounter.inc(labels);
    stopTimer(labels);
  }

  private normalizePath(request: {
    route?: { path?: string };
    originalUrl?: string;
    url?: string;
  }) {
    if (request?.route?.path) {
      return request.route.path;
    }
    const raw = request.originalUrl || request.url || 'unknown';
    return raw.split('?')[0];
  }
}
