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

  // ownerId will be accessed via the ActiveUser decorator, in the controller
  async createForOwner(ownerId: string, fieldDto: CreateFieldDto) {
    // Find the complex associated with the owner
    const complex = await this.complexModel.findOne({ owner: ownerId })
    // If no complex is found for the owner, throw an error
    if (!complex) {
      throw new BadRequestException('Complex not found for the given owner')
    }

    //max 10 field per complex
    const fieldCount = await this.fieldModel.countDocuments({ complexId: complex._id })
    if (fieldCount >= 10) {
      throw new BadRequestException('Maximum of 10 fields per complex reached')
    }

    // Create a new field using fieldDto and attach the complexId
    const createdField = new this.fieldModel({
      ...fieldDto,
      complexId: complex._id,
    })
    return createdField.save()
  }

  create(fieldDto: CreateFieldDto) {
    const createdField = new this.fieldModel(fieldDto)
    return createdField.save()
  }

  findAll() {
    return this.fieldModel.find().exec()
  }

  findOne(id: number) {
    return `This action returns a #${id} field`
  }
}
