import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { createComplexesDto } from './dto/create-complexes.dto'
import { User } from 'src/types/user'

@Injectable()
export class ComplexesService {
  constructor(
    @InjectModel('Complex') private complexModel: Model<createComplexesDto>,
    @InjectModel('User') private userModel: Model<User>,
  ) {}

  async userHasRoleOwner(userId: string) {
    const user = await this.userModel.findById(userId)

    return user && user.role === 'owner'
  }

  async userHasComplex(userId: string): Promise<boolean> {
    const count = await this.complexModel.countDocuments({ owner: userId })
    return count > 0
  }

  create(complexDto: createComplexesDto) {
    const created = new this.complexModel(complexDto)
    return created.save()
  }

  findAll() {
    return this.complexModel.find()
  }
}
