import { FileInterceptor } from '@nestjs/platform-express'
import { StorageEngine } from 'multer'
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface'
import { cloudinary } from 'src/config/cloudinary.config'
class CloudinaryStorage implements StorageEngine {
  _handleFile(req, file, cb) {
    cloudinary.uploader
      .upload_stream({ resource_type: 'image', folder: 'your-folder-name' }, (error, result) => {
        if (error) return cb(error)
        if (!result) return cb(new Error('No result returned from Cloudinary'))
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
        })
      })
      .end(file.buffer)
  }

  _removeFile(req, file, cb) {
    // Opcional: implementar si quieres borrar imágenes
    cb(null)
  }
}

export const cloudinaryStorage = () => {
  const storage = new CloudinaryStorage()
  return {
    storage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Solo se permiten imágenes'), false)
      }
      cb(null, true)
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  } as MulterOptions
}

export const CloudinaryFileInterceptor = () => FileInterceptor('file', cloudinaryStorage())
