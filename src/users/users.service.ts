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
      const uriIfNoProfileImage =
        'https://res.cloudinary.com/dsm9c4emg/image/upload/v1751077004/icono-perfil-usuario-estilo-plano-ilustracion-vector-avatar-miembro-sobre-fondo-aislado-concepto-negocio-signo-permiso-humano_157943-15752_ewx5pm.avif'
      const user = await this.findById(userId)
      if (!user) {
        throw new BadRequestException('User not found')
      }
      const profile = await this.getUserProfile(userId)

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new BadRequestException('Invalid image URL provided')
      }

      // 1. Eliminar la imagen anterior si existe y no es la imagen por defecto
      const previousImageUrl =
        profile && typeof profile === 'object' && 'image_url' in profile
          ? (profile as { image_url?: string }).image_url
          : undefined
      console.log('previousImageUrl:', previousImageUrl)
      if (previousImageUrl && previousImageUrl !== uriIfNoProfileImage) {
        const public_id = this.extractPublicIdFromUrl(previousImageUrl)
        console.log('public_id:', public_id)
        if (public_id) {
          try {
            await cloudinary.uploader.destroy(public_id, { resource_type: 'image' })
          } catch (e) {
            console.error('Error deleting previous image from Cloudinary:', e)
          }
        }
      }

      // 2. Actualizar con la nueva imagen
      return await this.userModel.findByIdAndUpdate(
        user._id,
        { image_url: imageUrl }, // Actualizar la URL de la imagen
        { new: true },
      )
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('Error updating user image URL')
    }
  }

  extractPublicIdFromUrl(url: string): string | null {
    try {
      // Busca la parte después de '/upload/' y antes de la extensión
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/)
      if (match && match[1]) {
        return match[1]
      }
      return null
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
        throw new BadRequestException('Could not extract public_id from image URL')
      }
      const cloudResult = (await cloudinary.uploader.destroy(public_id, {
        resource_type: 'image',
      })) as { result?: string }

      if (cloudResult.result !== 'ok' && cloudResult.result !== 'not found') {
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
