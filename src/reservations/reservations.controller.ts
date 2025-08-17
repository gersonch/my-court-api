import { Body, Controller, Get, Param, Post, Query, BadRequestException, Patch } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { Types } from 'mongoose'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Auth(Role.USER)
  @Post()
  create(@Body() body: CreateReservationDto) {
    return this.reservationsService.createReservation(body)
  }

  @Auth(Role.USER)
  @Get('user')
  getReservationsByUser(@ActiveUser() userId: IUserActive) {
    if (!Types.ObjectId.isValid(userId.sub)) {
      throw new BadRequestException('Invalid userId format')
    }
    return this.reservationsService.getReservationsByUserFromDate(userId.sub)
  }

  @Get(':fieldId')
  getReservations(@Param('fieldId') fieldId: string) {
    return this.reservationsService.getReservations(fieldId)
  }

  @Auth(Role.USER)
  @Get('user/history')
  getReservationsByUserFromDate(@ActiveUser() userId: IUserActive, @Query('limit') limit: string) {
    if (!Types.ObjectId.isValid(userId.sub)) {
      throw new BadRequestException('Invalid userId format')
    }
    return this.reservationsService.getHistoryReservationsByUser(userId.sub, Number(limit))
  }
  @Patch(':reservationId/cancel')
  cancelReservation(@Param('reservationId') reservationId: string) {
    if (!Types.ObjectId.isValid(reservationId)) {
      throw new BadRequestException('Invalid reservationId format')
    }

    return this.reservationsService.cancelReservation(reservationId)
  }
}
