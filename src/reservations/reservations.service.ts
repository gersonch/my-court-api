import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { Model } from 'mongoose'
import { CreateFieldDto } from 'src/fields/dto/create-field.dto'
import { Complex } from 'src/types/complexes'

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel('Reservation') private readonly reservationModel: Model<CreateReservationDto>,
    @InjectModel('Field') private readonly fieldModel: Model<CreateFieldDto>, // Replace 'any' with the actual Field type
    @InjectModel('Complex') private readonly complexModel: Model<Complex>,
  ) {}

  async createReservation(createReservationDto: CreateReservationDto) {
    // Validate if the field exists
    const field = await this.fieldModel.findById(createReservationDto.fieldId)
    if (!field) {
      throw new BadRequestException('Field not found')
    }
    // Validate if is schedule available
    const existingReservation = await this.reservationModel.findOne({
      startTime: createReservationDto.startTime,
      fieldId: createReservationDto.fieldId,
    })
    if (existingReservation) {
      throw new BadRequestException('This time slot is already reserved for this field')
    }

    return await this.reservationModel.create(createReservationDto)
  }

  async getReservations(fieldId: string) {
    const reservations = await this.reservationModel.find({ fieldId })
    if (!reservations) {
      throw new BadRequestException('No reservations found for this field')
    }
    return reservations
  }

  async getReservationsByUserFromDate(userId: string) {
    const fromDate = new Date()
    // get all reservations from fromDate
    if (!userId) throw new BadRequestException('User ID is required')

    const reservation = await this.reservationModel.find({ userId, startTime: { $gte: fromDate } })
    if (!reservation || reservation.length === 0) {
      throw new BadRequestException('No reservations found for this user from the specified date')
    }
    type ReservationWithNames = CreateReservationDto & { fieldName: string; complexName: string }
    const reservations: ReservationWithNames[] = []

    for (const res of reservation) {
      const field = await this.fieldModel.findById(res.fieldId)
      const complex = await this.complexModel.findById(res.complexId)

      if (field && complex) {
        reservations.push({ ...res.toObject(), fieldName: field.name, complexName: complex.name })
      }
    }

    return reservations
  }
}
