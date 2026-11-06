import { BadRequestException, InternalServerErrorException, Logger } from "@nestjs/common";



   
  //funcion privada para mostrar errores
  export function handleDBExceptions(error: any, loggerName:string) {

    const logger =new Logger(loggerName)

    if (error.code === '23505') throw new BadRequestException(error.detail);

    logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected error, check server logs '+ error.response.message,
    
      
    );
  }