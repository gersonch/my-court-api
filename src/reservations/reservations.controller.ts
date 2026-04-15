// eslint-disable-next-line prettier/prettier
import { Body, Controller, Get, Param, Post, Query, BadRequestException, Patch } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { Types } from 'mongoose'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'
import { PaginationQueryDto } from 'src/common/dto/pagination.dto'

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Auth(Role.USER)
  @Post()
  create(@Body() body: CreateReservationDto, @ActiveUser() user: IUserActive) {
    return this.reservationsService.createReservation(body, user.sub)
  }

  @Auth(Role.USER)
  @Get('user')
  getReservationsByUser(
    @ActiveUser() userId: IUserActive,
    @Query() pagination: PaginationQueryDto,
  ) {
    if (!Types.ObjectId.isValid(userId.sub)) {
      throw new BadRequestException('Invalid userId format')
    }
    return this.reservationsService.getReservationsByUserPaginated(
      userId.sub,
      pagination.page,
      pagination.limit,
    )
  }

  @Get(':fieldId')
  getReservations(@Param('fieldId') fieldId: string, @Query() pagination: PaginationQueryDto) {
    if (!Types.ObjectId.isValid(fieldId)) {
      throw new BadRequestException('Invalid fieldId format')
    }
    return this.reservationsService.getReservationsPaginated(
      fieldId,
      pagination.page,
      pagination.limit,
    )
  }

  @Auth(Role.USER)
  @Get('user/history')
  getReservationsByUserFromDate(@ActiveUser() userId: IUserActive, @Query('limit') limit: string) {
    if (!Types.ObjectId.isValid(userId.sub)) {
      throw new BadRequestException('Invalid userId format')
    }
    return this.reservationsService.getHistoryReservationsByUser(userId.sub, Number(limit))
  }

  @Auth(Role.USER)
  @Patch(':reservationId/cancel')
  cancelReservation(
    @Param('reservationId') reservationId: string,
    @ActiveUser() user: IUserActive,
  ) {
    if (!Types.ObjectId.isValid(reservationId)) {
      throw new BadRequestException('Invalid reservationId format')
    }

    return this.reservationsService.cancelReservation(reservationId, user.sub)
  }
}
