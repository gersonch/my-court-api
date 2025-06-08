import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import { Connection, Model } from 'mongoose'
import { CreateAdminWithComplexDto } from './dto/create-admin-with-complex.dto'
import { IComplex } from 'src/types/complexes'

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('Admin') private adminModel: Model<any>,
    @InjectModel('Complex') private complexModel: Model<IComplex>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createAdminWithComplex(dto: CreateAdminWithComplexDto) {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const [admin] = await this.adminModel.create([dto.admin], { session })
      await this.complexModel.create(
        [
          {
            ...dto.complex,
            owner: admin._id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { session },
      )
      await session.commitTransaction()
      session.endSession()
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw new InternalServerErrorException('Failed to create admin and complex', error)
    }
  }
}
