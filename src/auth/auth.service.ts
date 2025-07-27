import {
  BadRequestException,
  Injectable,
  InternalServerErrorException, //comentario para que se vea uno abajo del otro
  UnauthorizedException,
} from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { IAuthUser } from './interfaces/auth-user.interface'
import { validateRut } from '@fdograph/rut-utilities'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
    try {
      const payload = this.jwtService.verify<{
        sub: string
        email: string
        role: string
        id: string
      }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
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
        throw new BadRequestException('User already exists')
      }

      const exixtingRut = await this.usersService.findOne(registerDto.rut)
      if (exixtingRut) {
        throw new BadRequestException('RUT already exists')
      }
      console.log(registerDto.rut)

      const isRutValid: boolean = validateRut(registerDto.rut)

      if (!isRutValid) {
        throw new BadRequestException('Invalid RUT format')
      }

      // Sobrescribe el rut con el formato correcto antes de crear el usuario
      await this.usersService.create(registerDto)
      return { name: registerDto.name, email: registerDto.email }
    } catch {
      throw new InternalServerErrorException('Error registering user')
    }
  }

  async login({ email, password }: LoginDto) {
    try {
      const user = await this.validateUser(email, password)

      const payload = { email: user.email, role: user.role, sub: user.id }
      const token = this.jwtService.sign(payload, { expiresIn: '15m' })
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET,
      })

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
      await this.usersService.updateRefreshToken(user.id, hashedRefreshToken)

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }
    } catch {
      throw new InternalServerErrorException('Error logging in')
    }
  }

  async validateGoogleUser(googleUser: { email: string; firstName: string }) {
    let user = await this.usersService.findOne(googleUser.email)
    if (!user) {
      user = await this.usersService.create({
        email: googleUser.email,
        name: googleUser.firstName,
        rut: 'google',
        password: 'google',
      })
    }

    const payload = { email: user.email, role: user.role, sub: user._id }
    const token = this.jwtService.sign(payload, { expiresIn: '15m' })
    return { token, user }
  }
}
