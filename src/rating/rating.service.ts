import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateRatingDto } from './dto/ratingDto.dto'
import { Model } from 'mongoose'

import { Document, Types } from 'mongoose'
import { User } from 'src/types/user'
import { Complex } from 'src/types/complexes'

export interface Rating extends Document {
  userId: Types.ObjectId
  complexId: Types.ObjectId
  stars: number
}

@Injectable()
export class RatingService {
  constructor(
    @InjectModel('Rating') private readonly ratingModel: Model<Rating>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Complex') private readonly complexModel: Model<Complex>,
  ) {}

  async createRating(createRatingDto: CreateRatingDto, userId: string, complexId: string) {
    const complex = await this.complexModel.findById(complexId)
    if (!complex) {
      throw new BadRequestException('Complex not found.')
    }
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new BadRequestException('User not found.')
    }
    // busca en el rating model si existe un userId y complexId en algun campo.
    // si existe, lanza un BadRequestException
    const existingRating = await this.ratingModel.findOne({ userId, complexId })
    if (existingRating) {
      throw new BadRequestException('You have already rated this complex.')
    }

    const createdRating = new this.ratingModel({ ...createRatingDto, userId, complexId })
    return createdRating.save()
  }

  async updateRating(createRatingDto: CreateRatingDto, userId: string, complexId: string) {
    const existingRating = await this.ratingModel.findOne({ userId, complexId })
    if (!existingRating) {
      throw new BadRequestException('Rating not found.')
    }

    existingRating.stars = createRatingDto.stars

    return existingRating.save()
  }

  async getRatingForComplex(complexId: string): Promise<number> {
    const ratings = await this.ratingModel.find({ complexId })
    const stars = ratings.map((rating) => rating.stars)
    const totalRatings = ratings.length
    const averageRating = totalRatings > 0 ? stars.reduce((a, b) => a + b, 0) / totalRatings : 0
    console.log(ratings)
    return averageRating ? averageRating : 0
  }
}
