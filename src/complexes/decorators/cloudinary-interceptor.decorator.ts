import { FileInterceptor } from '@nestjs/platform-express'
import { StorageEngine } from 'multer'
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface'
import { cloudinary } from 'src/config/cloudinary.config'

class CloudinaryStorage implements StorageEngine {
  //prettier-ignore
  _handleFile(req: any, file: Express.Multer.File, cb: (error?: any, info?: Partial<Express.Multer.File>) => void) {
    if (!file || !file.stream) {
      return cb(new Error('Empty file or no stream provided'))
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'uploads', // Puedes personalizar este folder
      },
      (error, result) => {
        if (error || !result) {
          return cb(error || new Error('Upload failed'))
        }

        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
        })
      },
    )

    file.stream.pipe(uploadStream)
  }

  _removeFile(req, file, cb) {
    cb(null)
  }
}

export const cloudinaryStorage = (): MulterOptions => {
  const storage = new CloudinaryStorage()
  return {
    storage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Solo se permiten imágenes'), false)
      }
      cb(null, true)
    },
    limits: { fileSize: 500 * 1024 }, // 500 kb maximo
  }
}

export const CloudinaryFileInterceptor = () => FileInterceptor('file', cloudinaryStorage())
