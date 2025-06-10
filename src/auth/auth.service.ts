import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ name, email, password }: RegisterDto) {
    const user = await this.usersService.findOne(email)
    if (user) {
      throw new BadRequestException('User already exists')
    }
    await this.usersService.create({ name, email, password })
    return { name, email }
  }

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findWithPassword(email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const payload = { email: user.email, sub: user.id, role: user.role }

    const token = await this.jwtService.signAsync(payload)

    return { token }
  }

  async profile({ email, role }: { email: string; role: string }) {
    return await this.usersService.findOne(email)
  }
}
