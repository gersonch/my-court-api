import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateFieldDto } from './dto/create-field.dto'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Complex } from 'src/types/complexes'

@Injectable()
export class FieldsService {
  constructor(
    @InjectModel('Field') private readonly fieldModel: Model<CreateFieldDto>,
    @InjectModel('Complex') private readonly complexModel: Model<Complex>,
  ) {}

  async createField(createFieldDto: CreateFieldDto) {
    const { complexId, name } = createFieldDto
    const complex = await this.complexModel.findById(complexId).exec()
    if (!complex) {
      throw new BadRequestException('Complex not found')
    }
    const field = await this.fieldModel.find({ name, complexId })
    if (field && field.length > 0) {
      throw new BadRequestException('Field already exists')
    }

    const created = new this.fieldModel(createFieldDto)
    return created.save()
  }

  async findById(id: string) {
    return this.fieldModel.findById(id).exec()
  }

  async getFieldsByComplex(complexId: string) {
    const complex = await this.complexModel.findById(complexId)
    if (!complex) {
      throw new Error('Complex not found')
    }
    return this.fieldModel.find({ complexId: complexId })
  }
}
