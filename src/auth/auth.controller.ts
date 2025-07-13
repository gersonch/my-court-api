import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { Response, Request } from 'express'
import { JwtService } from '@nestjs/jwt'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  register(
    @Body()
    registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto)
  }

  @Post('login')
  async login(@Body() logindto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(logindto)

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return result
  }

  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response, // Use Res to manipulate cookies
    @Body('refreshToken') bodyToken: string, // Optional: you can also get it from the body
  ) {
    const refreshToken = req.cookies?.refreshToken || bodyToken
    if (!refreshToken) throw new UnauthorizedException('Refresh token is missing')
    const user = await this.authService.refresh(refreshToken)

    const token = this.jwtService.sign(
      { email: user.email, role: user.role, sub: user.id }, // Create a new JWT token
      { expiresIn: '15m' },
    )
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax', // Adjust as necessary
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    return {
      token: token, //
      refreshToken: refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token')
    res.clearCookie('refreshToken')
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
}
