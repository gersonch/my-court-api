import { Body, Controller, Get, Post, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { Auth } from './decorators/auth-passport.decorator'
import { Role } from '../common/guards/enums/rol.enum'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'
import { Response } from 'express'

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
  async login(@Body() logindto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const loginResult = await this.authService.login(logindto)

    res.cookie('token', loginResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax', // Adjust as necessary
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    return loginResult
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token')
    return { message: 'Logged out successfully' }
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

  @Auth(Role.USER)
  @Get('profile')
  profile(@ActiveUser() user: IUserActive) {
    console.log(user)
    return this.authService.profile(user)
  }
}
