import { IsMongoId, IsNotEmpty, IsString, IsNumber, ValidateNested, IsArray } from 'class-validator'
import { Type } from 'class-transformer'

class PricePerDurationDto {
  @IsNumber()
  price: number

  @IsString()
  duration: string
}

class TimeBlockDto {
  @IsNumber()
  dayOfWeek: number // 0 = domingo, 1 = lunes, etc.

  @IsString()
  from: string // Hora de inicio, ej: "08:00"

  @IsString()
  to: string // Hora de fin, ej: "09:00"

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricePerDurationDto)
  prices: PricePerDurationDto[]
}

export class CreateFieldDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  type: string

  @IsMongoId()
  complexId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDto)
  availability: TimeBlockDto[]
}
