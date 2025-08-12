import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { Model } from 'mongoose'
import { CreateFieldDto } from 'src/fields/dto/create-field.dto'
import { Complex } from 'src/types/complexes'
import { IReservation } from 'src/types/reservation'

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel('Reservation') private readonly reservationModel: Model<IReservation>,
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
    const reservations = await this.reservationModel.find({ fieldId, status: 'confirmed' })
    if (!reservations) {
      throw new BadRequestException('No reservations found for this field')
    }
    return reservations
  }

  async getReservationsByUserFromDate(userId: string) {
    const fromDate = new Date()
    // get all reservations from fromDate
    if (!userId) throw new BadRequestException('User ID is required')

    const reservation = await this.reservationModel.find({
      userId,
      startTime: { $gte: fromDate },
      status: { $in: ['confirmed', 'canceled'] },
    })
    if (!reservation || reservation.length === 0) {
      throw new BadRequestException('No reservations found for this user from the specified date')
    }
    type ReservationWithNames = CreateReservationDto & { fieldName: string; complexName: string }
    const reservations: ReservationWithNames[] = []

    for (const res of reservation) {
      const field = await this.fieldModel.findById(res.fieldId)
      const complex = await this.complexModel.findById(res.complexId)

      if (field && complex) {
        const resObj = res.toObject()
        reservations.push({
          ...resObj,
          fieldId: resObj.fieldId.toString(), //
          userId: resObj.userId.toString(),
          complexId: resObj.complexId.toString(),
          startTime: resObj.startTime instanceof Date ? resObj.startTime.toISOString() : resObj.startTime,

          fieldName: field.name,
          complexName: complex.name,
        })
      }
    }

    return reservations
  }

  async getHistoryReservationsByUser(userId: string, limit: number) {
    const toDate = new Date()
    if (!userId) throw new BadRequestException('User ID is required')

    const reservation = await this.reservationModel
      .find({ userId, startTime: { $lt: toDate }, status: { $in: ['confirmed', 'canceled'] } }) //
      .limit(limit)
    if (!reservation || reservation.length === 0) {
      throw new BadRequestException('No reservations found for this user in the history')
    }

    type ReservationWithNames = CreateReservationDto & { fieldName: string; complexName: string }
    const reservations: ReservationWithNames[] = []

    for (const res of reservation) {
      const field = await this.fieldModel.findById(res.fieldId)
      const complex = await this.complexModel.findById(res.complexId)

      if (field && complex) {
        const resObj = res.toObject()
        reservations.push({
          ...resObj,
          fieldId: resObj.fieldId.toString(),
          userId: resObj.userId.toString(),
          complexId: resObj.complexId.toString(),
          startTime: resObj.startTime instanceof Date ? resObj.startTime.toISOString() : resObj.startTime,
          fieldName: field.name,
          complexName: complex.name,
        })
      }
    }
    return reservations
  }

  async cancelReservation(reservationId: string) {
    const reservation = await this.reservationModel.findById(reservationId)
    if (!reservation) {
      throw new BadRequestException('Reservation not found')
    }
    if (reservation.status === 'canceled') {
      throw new BadRequestException('La reserva ya ha sido cancelada')
    }

    const currentTime = new Date()
    const reservationStartTime = new Date(reservation.startTime)
    // Check if the reservation can be canceled (e.g., at least 6 hours before the start time)
    const cancelableTime = new Date(reservationStartTime.getTime() - 6 * 60 * 60 * 1000) // 6 hours before
    if (currentTime > cancelableTime) {
      throw new BadRequestException(
        'No puedes cancelar la reserva con tan poco tiempo de antelación', //
      )
    }
    reservation.status = 'canceled'
    return await reservation.save()
  }
}
