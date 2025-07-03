import {
  BadRequestException,
  Injectable, //comentario para que se vea uno abajo del otro
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { IAuthUser } from './interfaces/auth-user.interface'

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
    const user = await this.usersService.findOne(registerDto.email)
    if (user) {
      throw new BadRequestException('User already exists')
    }
    await this.usersService.create(registerDto)
    return { name: registerDto.name, email: registerDto.email }
  }

  async login({ email, password }: LoginDto) {
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
  }

  async profile({ email, role }: { email: string; role: string }) {
    try {
      const profile = await this.usersService.findOne(email)

      if (!profile) {
        throw new BadRequestException('User not found')
      }

      return profile
    } catch {
      throw new InternalServerErrorException('Error fetching user profile')
    }
  }
}
