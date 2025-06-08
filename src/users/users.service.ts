import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Document } from 'mongoose'
import { User } from 'src/types/user'

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async create(userDto: Partial<User>) {
    const created = new this.userModel(userDto)
    return created.save()
  }

  async findAll() {
    return this.userModel.find()
  }
}
