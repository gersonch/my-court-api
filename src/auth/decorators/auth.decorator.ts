import { applyDecorators, UseGuards } from '@nestjs/common'
import { Role } from '../../common/guards/enums/rol.enum'
import { Roles } from './roles.decorator'
import { AuthGuard } from '../guards/auth.guard'
import { RolesGuard } from '../guards/roles.guard'

export function Auth(role: Role) {
  return applyDecorators(Roles(role), UseGuards(AuthGuard, RolesGuard))
}
