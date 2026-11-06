import { Controller, Get, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {

   
  }
  
   // Permite GET o POST para probar cómodamente en navegador o Postman
  @Get()
  executeSeedGet() {
    return this.seedService.runSeed();
  }

  @Post()
  executeSeedPost() {
    return this.seedService.runSeed();
  }
}