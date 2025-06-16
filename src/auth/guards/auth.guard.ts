import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'

import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)
    // prettier-ignore
    if (!token) {
      throw new UnauthorizedException("Invalid token. You don't have permission to access this resource.")
    }

    try {
      interface JwtPayload {
        // Add properties according to your JWT payload structure, e.g.:
        sub: string
        email?: string
        // Add other fields as needed
        [key: string]: any
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      })
      request['user'] = payload
    } catch {
      // prettier-ignore
      throw new UnauthorizedException("Invalid token. You don't have permission to access this resource.")
    }
    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    //desde headers
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    if (type === 'Bearer' && token) {
      return token
    }

    //desde cookies
    const cookies = request.cookies as Record<string, string> | undefined
    const tokenFromCookie = cookies?.token
    if (tokenFromCookie) {
      return tokenFromCookie
    }
  }
}
