import { Controller, Get, Post, Body } from '@nestjs/common'
import { UsersService } from './users.service'
import { User } from 'src/types/user'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: User) {
    return this.usersService.create(body)
  }

  @Get()
  findAll() {
    return this.usersService.findAll()
  }
}
