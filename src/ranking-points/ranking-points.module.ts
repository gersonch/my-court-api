import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { RankingPointsSchema } from './ranking-points.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: 'RankingPoints', schema: RankingPointsSchema }])],
  exports: [MongooseModule],
})
export class RankingPointsModule {}
