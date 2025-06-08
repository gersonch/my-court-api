import { Module } from '@nestjs/common'
import { AdminService } from './admin.service'
import { AdminController } from './admin.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { AdminSchema } from './admin.schema'
import { ComplexSchema } from 'src/complexes/complexes.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Admin', schema: AdminSchema },
      { name: 'Complex', schema: ComplexSchema },
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
