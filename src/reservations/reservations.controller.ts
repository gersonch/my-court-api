import { Body, Controller, Get, Param, Post, Query, BadRequestException, Patch } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { Types } from 'mongoose'

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Auth(Role.USER)
  @Post()
  create(@Body() body: CreateReservationDto) {
    return this.reservationsService.createReservation(body)
  }

  @Get(':fieldId')
  getReservations(@Param('fieldId') fieldId: string) {
    return this.reservationsService.getReservations(fieldId)
  }

  @Get('user/:userId')
  getReservationsByUser(@Param('userId') userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format')
    }
    return this.reservationsService.getReservationsByUserFromDate(userId)
  }

  @Get('user/:userId/history')
  getReservationsByUserFromDate(@Param('userId') userId: string, @Query('limit') limit: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format')
    }
    return this.reservationsService.getHistoryReservationsByUser(userId, Number(limit))
  }
  @Patch(':reservationId/cancel')
  cancelReservation(@Param('reservationId') reservationId: string) {
    if (!Types.ObjectId.isValid(reservationId)) {
      throw new BadRequestException('Invalid reservationId format')
    }

    return this.reservationsService.cancelReservation(reservationId)
  }
}
