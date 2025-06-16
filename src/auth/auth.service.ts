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

  async register({ name, email, password }: RegisterDto) {
    const user = await this.usersService.findOne(email)
    if (user) {
      throw new BadRequestException('User already exists')
    }
    await this.usersService.create({ name, email, password })
    return { name, email }
  }

  async login({ email, password }: LoginDto) {
    const user = await this.validateUser(email, password)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const payload = { email: user.email, role: user.role, sub: user.id }
    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
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
      if (role !== 'admin' && role !== 'user') {
        throw new BadRequestException('Invalid role')
      }
      return profile
    } catch {
      throw new InternalServerErrorException('Error fetching user profile')
    }
  }
}
