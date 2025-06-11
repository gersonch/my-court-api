import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<CreateUserDto>) {}

  async create(userDto: Partial<CreateUserDto>) {
    const created = new this.userModel(userDto)
    return created.save()
  }

  async findOne(email: string) {
    const user = await this.userModel.findOne({ email: email })
    return user
  }

  findWithPassword(email: string) {
    return this.userModel.findOne({ email }).select(['password', 'email', 'name', 'role', 'id'])
  }

  async findAll() {
    return this.userModel.find()
  }

  getUserIdByEmail(email: string) {
    return this.userModel.findOne({ email }).select(['id'])
  }
}
