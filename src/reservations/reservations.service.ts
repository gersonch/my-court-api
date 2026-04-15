import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { Model, Types } from 'mongoose'
import { CreateFieldDto } from 'src/fields/dto/create-field.dto'
import { Complex } from 'src/types/complexes'
import { IReservation } from 'src/types/reservation'
import { createPaginatedResponse } from 'src/common/dto/pagination.dto'

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel('Reservation') private readonly reservationModel: Model<IReservation>,
    @InjectModel('Field') private readonly fieldModel: Model<CreateFieldDto>,
    @InjectModel('Complex') private readonly complexModel: Model<Complex>,
  ) {}

  /**
   * Crea una reserva con manejo de race condition via unique index.
   *
   * @approach Unique Index + Error Handling
   * - El schema tiene un índice único parcial: { fieldId, startTime, status }
   *   con partialFilterExpression: { status: 'confirmed' }
   * - Si dos usuarios intentan reservar el mismo slot simultáneamente,
   *   MongoDB retorna error E11000 (duplicate key)
   * - Catcheamos ese error y lanzamos BadRequestException amigable
   *
   * @ benefits:
   * - Atomicidad sin transacciones (MongoDB lo maneja)
   * - No requiere replica set
   * - Más performante que queries condicionales
   *
   * @ tradeoffs:
   * - Error handling depende del código de error de MongoDB
   * - Si hay datos duplicados previos, el índice falla al crearse
   *
   * @ see: reservation.schema.ts - unique_confirmed_slot index
   */
  async createReservation(createReservationDto: CreateReservationDto, userId: string) {
    // 1. Validaciones de negocio (NO requieren DB transaction)
    const field = await this.fieldModel.findById(createReservationDto.fieldId)
    if (!field) {
      throw new BadRequestException('Field not found')
    }

    // validate if reservations is future not past
    if (new Date(createReservationDto.startTime) < new Date()) {
      throw new BadRequestException('Reservation time must be in the future')
    }

    // 2. Intento de creación - atomicidad manejada por MongoDB unique index
    try {
      const reservation = await this.reservationModel.create({
        ...createReservationDto,
        userId: new Types.ObjectId(userId),
        status: 'confirmed', // explícito - el índice aplica solo para confirmed
      })
      return reservation
    } catch (error: unknown) {
      // -----------------------------------------------------------------------------
      // @error MongoDB E11000 - Duplicate Key Error
      // @description El unique index previno la creación duplicada
      // @action user-friendly message
      // -----------------------------------------------------------------------------
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as Record<string, unknown>).code === 11000
      ) {
        throw new BadRequestException(
          'This time slot has already been reserved. Please choose another time.',
        )
      }

      // Re-lanzar otros errores como InternalServerError
      console.error('[createReservation] Unexpected error:', error)
      throw error
    }
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

  /**
   * Obtiene las reservas de una cancha con paginación
   */
  async getReservationsPaginated(fieldId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endDate = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 días

    const query = {
      fieldId: new Types.ObjectId(fieldId),
      status: 'confirmed',
      startTime: { $gte: startOfToday, $lte: endDate },
    }

    const [data, total] = await Promise.all([
      this.reservationModel
        .find(query)
        .select('fieldId startTime duration')
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reservationModel.countDocuments(query),
    ])

    return createPaginatedResponse(data, page, limit, total)
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

  /**
   * Obtiene las reservas del usuario con paginación (futuras)
   */
  async getReservationsByUserPaginated(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    const fromDate = new Date()

    if (!userId) throw new BadRequestException('User ID is required')

    // Count total para paginación
    const total = await this.reservationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      startTime: { $gte: fromDate },
      status: { $in: ['confirmed', 'canceled'] },
    })

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
      { $skip: skip },
      { $limit: limit },
    ])

    return createPaginatedResponse(reservations, page, limit, total)
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

  async cancelReservation(reservationId: string, userId: string) {
    const reservation = await this.reservationModel.findById(reservationId)
    if (!reservation) {
      throw new BadRequestException('Reservation not found')
    }
    if (reservation.userId.toString() !== userId) {
      throw new BadRequestException('You are not the owner of this reservation')
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
