import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { RatingService } from './rating.service'
import { CreateRatingDto } from './dto/ratingDto.dto'

import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { IUserActive } from 'src/common/interfaces/user-active.interface'

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Auth(Role.USER)
  @Post(':complexId')
  createRating(
    @Body() createRatingDto: CreateRatingDto,
    @ActiveUser() user: IUserActive,
    @Param('complexId') complexId: string,
  ) {
    return this.ratingService.createRating(createRatingDto, user.sub, complexId)
  }

  @Auth(Role.USER)
  @Put(':complexId')
  updateRating(
    @Body() createRatingDto: CreateRatingDto,
    @ActiveUser() user: IUserActive,
    @Param('complexId') complexId: string,
  ) {
    return this.ratingService.updateRating(createRatingDto, user.sub, complexId)
  }

  @Auth(Role.USER)
  @Get(':complexId/user')
  async getRatingsForUser(@ActiveUser() user: IUserActive, @Param('complexId') complexId: string) {
    const ratings = await this.ratingService.getRatingsForUser(user.sub, complexId)
    if (!ratings) {
      return {
        message: 'You have not rated this complex yet.',
        ratings: null,
      }
    }
    return {
      message: 'Ratings found.',
      ratings,
    }
  }

  @Get()
  async getRatingsForComplexes(@Query('ids') ids: string) {
    const complexIds = ids.split(',')
    const ratings = await Promise.all(complexIds.map((id) => this.ratingService.getRatingForComplex(id)))
    return complexIds.map((id, idx) => ({ complexId: id, rating: ratings[idx] }))
  }
}
