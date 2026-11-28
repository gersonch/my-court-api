import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config' // ← #5/#6: inyectar ConfigService
import { UsersService } from 'src/users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { IAuthUser } from './interfaces/auth-user.interface'
import { validateRut } from '@fdograph/rut-utilities'
import { Role } from 'src/common/guards/enums/rol.enum'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // ← #5/#6: inyectar ConfigService en constructor
  ) {}

  async validateUser(email: string, password: string): Promise<IAuthUser> {
    const user = await this.usersService.findWithPassword(email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const { name, role, _id } = user
    return { id: _id.toString(), name, email, role }
  }

  async refresh(refreshToken: string) {
    const refreshSecret = this.getRefreshSecret() // ← #5: lee via ConfigService (no process.env)
    try {
      const payload = this.jwtService.verify<{
        sub: string
        email: string
        role: string
        id: string
      }>(refreshToken, {
        secret: refreshSecret, // ← #5: era process.env.JWT_REFRESH_SECRET
      })
      const user = await this.usersService.findById(payload.sub)
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      const ismatch = await bcrypt.compare(refreshToken, user.refreshToken)
      if (!ismatch) {
        throw new UnauthorizedException('Invalid refresh token')
      }
      return { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.usersService.findOne(registerDto.email)
      if (user) {
        if (user.provider && user.provider !== 'local') {
          throw new BadRequestException(
            `Este usuario ya existe con el proveedor ${user.provider}. Inicia sesión con ${user.provider}.`,
          )
        }
        throw new BadRequestException('User already exists')
      }

      const existingRut = await this.usersService.findByRut(registerDto.rut)
      if (existingRut) {
        throw new BadRequestException('RUT already exists')
      }

      const isRutValid: boolean = validateRut(registerDto.rut)
      if (!isRutValid) {
        throw new BadRequestException('Invalid RUT format')
      }

      const data = { ...registerDto, provider: 'local', role: 'user' }

      await this.usersService.create(data)
      return { name: registerDto.name, email: registerDto.email }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
      throw new InternalServerErrorException('Error registering user', message)
    }
  }

  private async login({ email, password }: LoginDto, requiredRole: Role) {
    const refreshSecret = this.getRefreshSecret() // ← #5: lee via ConfigService (no process.env)
    try {
      const user = await this.usersService.findOne(email)

      if (!user || user.role !== requiredRole) {
        throw new UnauthorizedException('Invalid credentials')
      }
      if (user.provider !== 'local') {
        throw new BadRequestException(
          `Este usuario ya existe con el proveedor ${user.provider}. Inicia sesión con ${user.provider}.`,
        )
      }
      const validatedUser = await this.validateUser(email, password)

      const payload = {
        email: validatedUser.email,
        role: validatedUser.role,
        sub: validatedUser.id,
      }
      const token = this.jwtService.sign(payload, { expiresIn: 60 * 15 })
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: 60 * 60 * 24 * 7,
        secret: refreshSecret, // ← #5: era process.env.JWT_REFRESH_SECRET
      })

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
      await this.usersService.updateRefreshToken(validatedUser.id, hashedRefreshToken)

      return {
        token,
        refreshToken,
        user: {
          id: validatedUser.id,
          name: validatedUser.name,
          email: validatedUser.email,
          role: validatedUser.role,
        },
      }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw new InternalServerErrorException('Error logging in')
    }
  }

  async loginUser(dto: LoginDto) {
    return this.login(dto, Role.USER)
  }

  async loginOwner(dto: LoginDto) {
    return this.login(dto, Role.OWNER)
  }

  async validateGoogleUser(googleUser: { email: string; firstName: string }) {
    let user = await this.usersService.findOne(googleUser.email)
    if (!user) {
      user = await this.usersService.create({
        email: googleUser.email,
        name: googleUser.firstName,
        provider: 'google',
      })
    }

    const payload = { email: user.email, role: user.role, sub: user._id }
    const token = this.jwtService.sign(payload, { expiresIn: '15m' })
    return { token, user }
  }

  // ← #5: helper privado que valida que el secret existe (lanza 500 si no)
  private getRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET')
    if (!secret) {
      throw new InternalServerErrorException('JWT_REFRESH_SECRET not configured')
    }
    return secret
  }
}
