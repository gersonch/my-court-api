// eslint-disable-next-line prettier/prettier
import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { Response, Request } from 'express'
import { JwtService } from '@nestjs/jwt'
import { AuthGuard } from '@nestjs/passport'

// SWAGGER: Decorators para documentar el controller
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('Autenticación') // SWAGGER: Agrupar endpoints
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario', description: 'Crea un nuevo usuario en el sistema' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El email ya existe' })
  register(
    @Body()
    registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto)
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica al usuario y retorna tokens en cookies' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
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
  @ApiOperation({ summary: 'Renovar token', description: 'Actualiza el token de acceso usando el refresh token' })
  @ApiResponse({ status: 200, description: 'Token renovado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') bodyToken: string,
  ) {
    const refreshToken = (req.cookies as Record<string, string | undefined>)?.refreshToken || bodyToken
    if (!refreshToken) throw new UnauthorizedException('Refresh token is missing')
    const user = await this.authService.refresh(refreshToken)

    const token = this.jwtService.sign({ email: user.email, role: user.role, sub: user.id }, { expiresIn: '15m' })
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    })
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return {
      token: token,
      refreshToken: refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión', description: 'Limpia las cookies de autenticación' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token')
    res.clearCookie('refreshToken')
    return { message: 'Logged out successfully' }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login con Google', description: 'Redirige al proveedor de Google para autenticación' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback de Google', description: 'Procesa la respuesta de Google y crea la sesión' })
  async googleAuthRedirect(@Req() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.validateGoogleUser(req.user)
    res.cookie('token', result.token, { httpOnly: true })
    res.redirect(`exp://192.168.1.4:3000?token=${result.token}`)
    return result
  }

  @Get('google/mobile')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login con Google (Mobile)', description: 'Redirige a app móvil tras autenticación' })
  async googleAuthMobile(@Req() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.validateGoogleUser(req.user)

    res.redirect(`com.negors.hola?token=${result.token}`)
    return result
  }
}
