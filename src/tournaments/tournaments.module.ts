import { Module } from '@nestjs/common'
import { TournamentsController } from './tournaments.controller'
import { TournamentsService } from './tournaments.service'
import { MongooseModule } from '@nestjs/mongoose'
import { ComplexSchema } from 'src/complexes/complexes.schema'
import { UserSchema } from 'src/users/users.schema'
import { AuthModule } from 'src/auth/auth.module'
import { TournamentSchema } from './tournament.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Tournament', schema: TournamentSchema },
      { name: 'Complex', schema: ComplexSchema },
      { name: 'User', schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}
