import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { createComplexesDto } from './dto/create-complexes.dto'

@Injectable()
export class ComplexesService {
  constructor(@InjectModel('Complex') private complexModel: Model<createComplexesDto>) {}

  create(complexDto: createComplexesDto) {
    const created = new this.complexModel(complexDto)
    return created.save()
  }

  findAll() {
    return this.complexModel.find()
  }
}
