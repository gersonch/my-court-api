import { IsMongoId, IsNotEmpty, IsString, IsNumber } from 'class-validator'

export class CreateReservationDto {
  @IsMongoId()
  fieldId: string

  @IsMongoId()
  userId: string

  @IsMongoId()
  complexId: string

  @IsNotEmpty()
  @IsString()
  startTime: string // formato "YYYY-MM-DDTHH:mm" o similar

  @IsNotEmpty()
  @IsString()
  duration: string // ejemplo: "01:00"

  @IsNotEmpty()
  @IsNumber()
  price: number
}
