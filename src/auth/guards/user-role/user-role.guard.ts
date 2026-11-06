import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

import { Reflector } from '@nestjs/core';
import { META_ROLES } from 'src/auth/decorators/role-protected.decorator';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class UserRoleGuard implements CanActivate {

   constructor(
     private readonly reflector:Reflector
   ){}


  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    //obtener la informacion de la metaData
    const validRoles: string[]= this.reflector.get(
      META_ROLES,
      context.getHandler()
    )

    //obtener la informacion del usuario
    const req = context.switchToHttp().getRequest()
    const user = req.user as User

    if(!user){
       throw new BadRequestException('User not found')
    }

    //validamos que el rol del usuario sea valido
    for(const role of user.roles){
      if(validRoles.includes(role)){
         return true
      }
    }

    //lansamos un error si el usuario no tiene un rol valido
    throw new ForbiddenException(
      `User ${user.fullName} need a valid roel :[${validRoles}
      ]`
    )

  }
}
