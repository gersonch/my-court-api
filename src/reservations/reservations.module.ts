import { Module } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import { ReservationsController } from './reservations.controller'
import { ReservationSchema } from './reservation.schema'
import { FieldSchema } from 'src/fields/field.schema'

import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Reservation', schema: ReservationSchema },
      { name: 'Field', schema: FieldSchema },
      { name: 'Complex', schema: 'Complex' }, // Assuming Complex schema is defined elsewhere
    ]),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
