import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const apiKey = request.headers['x-api-key']
    if (typeof apiKey !== 'string' || apiKey !== this.configService.get<string>('ADMIN_API_KEY')) {
      throw new UnauthorizedException('API key must be a string')
    }
    const validApiKey = this.configService.get<string>('ADMIN_API_KEY')

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid or missing API key')
    }
    return true
  }
}
