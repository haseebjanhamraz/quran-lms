import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    
    return next.handle().pipe(
      tap(() => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          // Ignore login as it's handled explicitly in auth.service
          if (req.route && req.route.path.includes('/login')) return;

          const user = req.user;
          const action = `${method} ${req.route?.path || req.url}`;
          
          // Scrub sensitive data from body
          const sanitizedBody = { ...req.body };
          if (sanitizedBody.password) sanitizedBody.password = '***';
          
          this.auditLogsService.log(
            action, 
            user?.sub || user?.id || null, 
            { body: sanitizedBody, params: req.params, query: req.query }
          ).catch((err) => console.error('Audit log failed', err));
        }
      }),
    );
  }
}
