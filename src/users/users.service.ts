import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateUserDto } from './dto/create-user.dto'
import { UserProfileDto } from './dto/user-profile.dto'
import { cloudinary } from 'src/config/cloudinary.config'

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<CreateUserDto>) {}

  async create(userDto: Partial<CreateUserDto>) {
    const created = new this.userModel(userDto)
    return created.save()
  }
  async updateRefreshToken(userId: string, refreshToken: string) {
    return this.userModel.findByIdAndUpdate(userId, { refreshToken })
  }

  async findOne(email: string) {
    const user = await this.userModel.findOne({ email: email })
    return user
  }

  async findById(id: string) {
    return this.userModel.findById(id)
  }

  findWithPassword(email: string) {
    return this.userModel
      .findOne({ email }) // Find user by email
      .select(['password', 'email', 'name', 'role', 'id'])
  }

  async findAll() {
    return this.userModel.find()
  }

  async getUserProfile(id: string) {
    return await this.userModel
      .findById(id)
      .select(['name', 'email', 'image_url', 'country', 'city', 'address', 'phone'])
  }

  async updateUserProfile(id: string, userProfile: Partial<UserProfileDto>) {
    return await this.userModel.findByIdAndUpdate(id, userProfile, { new: true })
  }

  async updateImageUrl(userId: string, imageUrl: string) {
    try {
      const user = await this.findById(userId)
      if (!user) {
        throw new BadRequestException('User not found')
      }

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new BadRequestException('Invalid image URL provided')
      }

      return await this.userModel.findByIdAndUpdate(
        user._id, // Use the _id of the user
        { image_url: imageUrl },
        { new: true },
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Error updating user image URL')
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

  async deleteUserImage(userId: string, imageUrl: string) {
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
      })) as { result?: string }

      if (cloudResult.result !== 'ok') {
        throw new BadRequestException('Error deleting image from Cloudinary')
      }

      return this.userModel.findByIdAndUpdate(
        {
          _id: userId, // Use the _id of the user
        },
        { image_url: '' },
        { new: true },
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Error deleting user image URL')
    }
  }
}
