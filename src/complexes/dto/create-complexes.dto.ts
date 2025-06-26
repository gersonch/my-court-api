import { IsArray, IsIn, IsOptional, IsString } from 'class-validator'

export class createComplexesDto {
  @IsString()
  name: string

  @IsString()
  region: string

  @IsString()
  address: string

  @IsString()
  city: string

  @IsString()
  country: string

  @IsString()
  description: string

  @IsString()
  owner: string

  @IsOptional()
  @IsArray()
  image_url?: string[]
}

export class addImageUrlDto {
  @IsString()
  image_url: string
}

export class updateComplexDto {
  @IsOptional()
  @IsArray()
  @IsIn(['futbol', 'tenis', 'padel'], { each: true })
  sports?: string[]

  @IsOptional()
  equipment?: {
    futbol?: boolean
    tenis?: boolean
    padel?: boolean
  }

  @IsOptional()
  facilities?: {
    parking?: boolean
    bar?: boolean
    restaurant?: boolean
    changingRooms?: boolean
    showers?: boolean
  }
}
