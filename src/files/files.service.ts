

import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  async uploadImage(file: Express.Multer.File, folder = 'bar_superior/products'): Promise<string> {
    if (!file) {
      throw new BadRequestException('Asegúrate de enviar un archivo de imagen');
    }
    

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          // Opciones recomendadas para optimizar almacenamiento y carga:
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result: UploadApiResponse | undefined) => {
          
          if (error || !result) {
            return reject(new BadRequestException('Error al subir imagen a Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  }
}