import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
import { RatingService } from './rating.service'
import { CreateRatingDto } from './dto/ratingDto.dto'

import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { IUserActive } from 'src/common/interfaces/user-active.interface'

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get()
  getRatingForComplex(@Body('complexId') complexId: string) {
    return this.ratingService.getRatingForComplex(complexId)
  }

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
}
