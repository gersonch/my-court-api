import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { IComplex } from 'src/types/complexes'

@Injectable()
export class ComplexesService {
  constructor(@InjectModel('Complex') private complexModel: Model<IComplex>) {}

  create(complexDto: IComplex) {
    const created = new this.complexModel(complexDto)
    return created.save()
  }

  findAll() {
    return this.complexModel.find()
  }
}
