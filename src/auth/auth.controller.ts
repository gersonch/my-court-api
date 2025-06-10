import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { AuthGuard } from './guards/auth.guard'
import { Request } from 'express'
import { Roles } from './decorators/roles.decorator'

interface RequestWithUser extends Request {
  user: {
    email: string
    role: string
  }
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto)
  }
  @Post('login')
  login(@Body() logindto: LoginDto) {
    return this.authService.login(logindto)
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @Roles('admin')
  profile(
    @Req()
    req: RequestWithUser,
  ) {
    return req.user
  }
}
