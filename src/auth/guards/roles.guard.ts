import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { Role } from '../../common/guards/enums/rol.enum'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // prettier-ignore
    const role = this.reflector.getAllAndOverride<Role>(ROLES_KEY, [context.getHandler(), context.getClass()])

    if (!role) {
      return true
    }

    const request = context.switchToHttp().getRequest<{ user: { role: Role } }>()
    const { user } = request

    if (user.role === Role.ADMIN) {
      return true
    }
    return role === user.role
  }
}
