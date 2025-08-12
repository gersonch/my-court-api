import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'

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
    return this.reservationsService.getReservationsByUserFromDate(userId)
  }
}
