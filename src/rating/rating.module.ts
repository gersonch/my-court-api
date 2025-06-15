import { Module } from '@nestjs/common'
import { RatingController } from './rating.controller'
import { RatingService } from './rating.service'
import { MongooseModule } from '@nestjs/mongoose'
import { RatingSchema } from './rating.schema'
import { AuthModule } from 'src/auth/auth.module'
import { UserSchema } from 'src/users/users.schema'
import { ComplexSchema } from 'src/complexes/complexes.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Rating', schema: RatingSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Complex', schema: ComplexSchema }, // Assuming Complex schema is similar to Rating
    ]),
    AuthModule,
  ],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
