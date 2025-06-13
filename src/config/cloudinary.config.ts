import { v2 as cloudinary } from 'cloudinary'
const CloudName = process.env.CLOUDINARY_CLOUD_NAME
const ApiKey = process.env.CLOUDINARY_API_KEY
const ApiSecret = process.env.CLOUDINARY_API_SECRET

cloudinary.config({
  cloud_name: CloudName,
  api_key: ApiKey,
  api_secret: ApiSecret,
  secure: true,
})

export { cloudinary }
