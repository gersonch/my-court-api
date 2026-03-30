import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { Model, Types } from 'mongoose'
import { CreateFieldDto } from 'src/fields/dto/create-field.dto'
import { Complex } from 'src/types/complexes'
import { IReservation } from 'src/types/reservation'

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel('Reservation') private readonly reservationModel: Model<IReservation>,
    @InjectModel('Field') private readonly fieldModel: Model<CreateFieldDto>,
    @InjectModel('Complex') private readonly complexModel: Model<Complex>,
  ) {}

  async createReservation(createReservationDto: CreateReservationDto) {
    // Validate if the field exists
    const field = await this.fieldModel.findById(createReservationDto.fieldId)
    if (!field) {
      throw new BadRequestException('Field not found')
    }
    // validate if reservations is future not past
    if (new Date(createReservationDto.startTime) < new Date()) {
      throw new BadRequestException('Reservation time must be in the future')
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
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endDate = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 días
    return await this.reservationModel
      .find({
        fieldId: new Types.ObjectId(fieldId),
        status: 'confirmed',
        startTime: { $gte: startOfToday, $lte: endDate },
      })
      .select('startTime duration')
      .sort({ startTime: 1 })
  }

  async getReservationsByUserFromDate(userId: string) {
    const fromDate = new Date()
    if (!userId) throw new BadRequestException('User ID is required')

    // Usar aggregation para hacer $lookup en lugar de N+1 queries
    const reservations: IReservation[] = await this.reservationModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          startTime: { $gte: fromDate },
          status: { $in: ['confirmed', 'canceled'] },
        },
      },
      {
        $lookup: {
          from: 'fields',
          localField: 'fieldId',
          foreignField: '_id',
          as: 'field',
        },
      },
      {
        $lookup: {
          from: 'complexes',
          localField: 'complexId',
          foreignField: '_id',
          as: 'complex',
        },
      },
      {
        $unwind: { path: '$field', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$complex', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          fieldId: { $toString: '$fieldId' },
          userId: { $toString: '$userId' },
          complexId: { $toString: '$complexId' },
          startTime: 1,
          duration: 1,
          price: 1,
          status: 1,
          createdAt: 1,
          fieldName: { $ifNull: ['$field.name', ''] },
          complexName: { $ifNull: ['$complex.name', ''] },
        },
      },
      {
        $sort: { startTime: 1 },
      },
    ])

    if (!reservations || reservations.length === 0) {
      throw new BadRequestException('No reservations found for this user from the specified date')
    }

    return reservations
  }

  async getHistoryReservationsByUser(userId: string, limit: number) {
    const toDate = new Date()
    if (!userId) throw new BadRequestException('User ID is required')
    if (isNaN(limit) || limit <= 0) {
      throw new BadRequestException('limit must be a number greater than 0')
    }

    // Usar aggregation para hacer $lookup en lugar de N+1 queries
    const reservations: IReservation[] = await this.reservationModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          startTime: { $lt: toDate },
          status: { $in: ['confirmed', 'canceled'] },
        },
      },
      {
        $lookup: {
          from: 'fields',
          localField: 'fieldId',
          foreignField: '_id',
          as: 'field',
        },
      },
      {
        $lookup: {
          from: 'complexes',
          localField: 'complexId',
          foreignField: '_id',
          as: 'complex',
        },
      },
      {
        $unwind: { path: '$field', preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: '$complex', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          fieldId: { $toString: '$fieldId' },
          userId: { $toString: '$userId' },
          complexId: { $toString: '$complexId' },
          startTime: 1,
          duration: 1,
          price: 1,
          status: 1,
          createdAt: 1,
          fieldName: { $ifNull: ['$field.name', ''] },
          complexName: { $ifNull: ['$complex.name', ''] },
        },
      },
      {
        $sort: { startTime: -1 },
      },
      { $limit: limit },
    ])

    if (!reservations || reservations.length === 0) {
      throw new BadRequestException('No reservations found for this user in the history')
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
