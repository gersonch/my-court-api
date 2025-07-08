import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { createComplexesDto, updateComplexDto } from './dto/create-complexes.dto'
import { User } from 'src/types/user'
import { cloudinary } from 'src/config/cloudinary.config'
import { Rating } from 'src/rating/rating.service'

interface CloudinaryDestroyResponse {
  result: string
}
@Injectable()
export class ComplexesService {
  constructor(
    @InjectModel('Complex') private complexModel: Model<createComplexesDto>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Rating') private ratingModel: Model<Rating>,
  ) {}

  async getComplexIdByOwner(userId: string): Promise<string | null> {
    const complex = await this.complexModel.findOne({ owner: userId })
    if (!complex) {
      throw new BadRequestException('Complex not found for the given owner')
    }
    return complex._id.toString() // Convertimos a string para mayor compatibilidad
  }

  async userHasRoleOwner(userId: string) {
    const user = await this.userModel.findById(userId)
    return user && user.role === 'owner'
  }

  async userHasComplex(userId: string): Promise<boolean> {
    const count = await this.complexModel.countDocuments({ owner: userId })
    return count > 0
  }

  async create(complexDto: createComplexesDto) {
    try {
      if (!complexDto.owner) {
        throw new BadRequestException('Owner ID is required')
      }
      const created = new this.complexModel(complexDto)
      return await created.save()
    } catch {
      // Puedes personalizar el mensaje o loguear el error si lo necesitas
      throw new InternalServerErrorException('Error creating complex')
    }
  }

  findAll() {
    return this.complexModel.find()
  }

  async addImageUrl(userId: string, imageUrl: string) {
    try {
      const complex = await this.complexModel.findOne({ owner: userId })

      if (!complex) {
        throw new BadRequestException('Complex not found for the given owner')
      }
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new BadRequestException('Invalid image URL provided')
      }

      const imageCount = complex.image_url?.length ?? 0
      if (imageCount >= 10) {
        throw new BadRequestException('Cannot add more than 10 images to a complex')
      }

      return await this.complexModel.findByIdAndUpdate(
        complex._id, // ✅ Aquí usamos el _id del complejo
        { $push: { image_url: imageUrl } },
        { new: true },
      )
    } catch (error) {
      // Puedes loguear el error aquí si deseas
      console.error(error)
      throw new InternalServerErrorException('Error adding image to complex')
    }
  }

  extractPublicIdFromUrl(url: string): string | null {
    try {
      const parts = url.split('/')
      const fileName = parts.at(-1)?.split('.')[0]
      const folder = parts.at(-2)
      if (!fileName || !folder) return null
      return `${folder}/${fileName}` // Ej: uploads/abc123
    } catch {
      return null
    }
  }

  async deleteImageUrl(userId: string, imageUrl: string) {
    try {
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new BadRequestException('Invalid image URL provided')
      }

      const public_id = this.extractPublicIdFromUrl(imageUrl)
      if (!public_id) {
        throw new BadRequestException('Invalid image URL format')
      }

      const cloudResult = (await cloudinary.uploader.destroy(public_id, {
        resource_type: 'image',
      })) as unknown as CloudinaryDestroyResponse

      if (cloudResult.result !== 'ok') {
        throw new BadRequestException('Error deleting image from Cloudinary')
      }

      return this.complexModel.findOneAndUpdate(
        { owner: userId }, // ✅ Aquí usamos el owner para encontrar el complejo
        { $pull: { image_url: imageUrl } },
        { new: true },
      )
    } catch {
      throw new InternalServerErrorException('Error deleting image URL')
    }
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
