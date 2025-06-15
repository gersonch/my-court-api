import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import * as dotenv from 'dotenv'
dotenv.config()

const configService = new ConfigService()

cloudinary.config({
  cloud_name: configService.get<string>('CLOUDINARY_NAME'),
  api_key: configService.get<string>('CLOUDINARY_API_KEY'),
  api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
  secure: true,
})

export { cloudinary }
