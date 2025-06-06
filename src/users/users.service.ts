import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<any>) {}

  async create(userDto: any) {
    const created = new this.userModel(userDto);
    return created.save();
  }

  async findAll() {
    return this.userModel.find();
  }
}
