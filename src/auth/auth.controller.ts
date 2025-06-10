import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { Request } from 'express'
import { Auth } from './decorators/auth.decorator'
import { Role } from '../common/guards/enums/rol.enum'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'

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

  // @Get('profile')
  // @UseGuards(AuthGuard)
  // @Roles('admin')
  // profile(
  //   @Req()
  //   req: RequestWithUser,
  // ) {
  //   return req.user
  // }

  @Get('profile')
  @Auth(Role.USER)
  profile(@ActiveUser() user: IUserActive) {
    console.log(user)
    return this.authService.profile(user)
  }
}
