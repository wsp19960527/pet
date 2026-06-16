import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '@pet/shared';

@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<T extends JwtPayload>(err: Error | null, user: T | false): T {
    if (err || !user || user.type !== 'admin') {
      throw err ?? new UnauthorizedException('Admin access required');
    }
    return user;
  }
}
