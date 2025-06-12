import { IsString } from 'class-validator'

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

  @IsString()
  image_url: string[]
}

export class addImageUrlDto {
  @IsString()
  imageUrl: string
}
