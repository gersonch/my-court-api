import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { createComplexesDto, updateComplexDto } from './dto/create-complexes.dto'
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

  async addImageUrl(userId: string, imageUrl: string) {
    const complex = await this.complexModel.findOne({ owner: userId })

    if (!complex) {
      throw new BadRequestException('Complex not found for the given owner')
    }
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new BadRequestException('Invalid image URL provided')
    }

    const imageCount = complex?.image_url?.length ?? 0
    if (imageCount >= 10) {
      throw new BadRequestException('Cannot add more than 10 images to a complex')
    }

    return this.complexModel.findByIdAndUpdate(
      complex._id, // ✅ Aquí usamos el ID del complejo
      { $push: { image_url: imageUrl } },
      { new: true },
    )
  }

  async updateComplex(updateComplex: updateComplexDto, userId: string) {
    const complex = await this.complexModel.findOne({ owner: userId })
    if (!complex) {
      throw new BadRequestException('Complex not found for the given owner')
    }

    const updatedComplex = await this.complexModel.findByIdAndUpdate(
      complex._id,
      { $set: updateComplex },
      { new: true },
    )

    return updatedComplex
  }

  async findById(complexId: string, userId: string) {
    if (!complexId) {
      throw new BadRequestException('Complex ID is required')
    }
    if (!userId) {
      throw new BadRequestException('User ID is required')
    }
    const complex = await this.complexModel.findOne({ _id: complexId, owner: userId })
    if (!complex) {
      throw new BadRequestException('Complex not found for the given ID and owner')
    }
    return complex
  }
}
