import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [CloudinaryProvider, FilesService],
  exports: [FilesService],
})
export class FilesModule {}