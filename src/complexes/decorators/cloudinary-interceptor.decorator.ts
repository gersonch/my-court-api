import { FileInterceptor } from '@nestjs/platform-express'
import { StorageEngine } from 'multer'
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface'
import { cloudinary } from 'src/config/cloudinary.config'
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary'
import { Request } from 'express'

interface MulterFileWithPath extends Express.Multer.File {
  path: string
}

class CloudinaryStorage implements StorageEngine {
  //prettier-ignore
  _handleFile(req: Request, file: MulterFileWithPath, cb: (error?: any, info?: Partial<Express.Multer.File>) => void):void {

    if (!file || !file.stream) {
      return cb(new Error('Empty file or no stream provided'))
    }
    const userId =
      (req as Request & { user?: { sub?: string } }).user?.sub || 'default'

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: `uploads/${userId}`,  // Puedes personalizar este folder
      },
      (error: UploadApiErrorResponse , result: UploadApiResponse) => {
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

  _removeFile(req: Request, file: Express.Multer.File, cb: (error: Error | null) => void): void {
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
