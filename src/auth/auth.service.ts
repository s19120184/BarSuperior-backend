import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { userInfo } from 'os';
import { jwtPayload } from './interfaces/jwt-payload.interface';
import { LoginUserDto } from './dto/login.user.dto';
import { NotFoundError } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...useData } = createUserDto;

      const user = this.userRepository.create({
        ...useData,
        //encripatar el password
        password: bcrypt.hashSync(password, 10),
      });
      await this.userRepository.save(user);

      //desestructuramos para no retornal el password
      const { password: pass, ...useInfo } = user;

      return {
        ...userInfo,
        token: this.getJwtToken({ id: user.id }),
      };
    } catch (error) {
      this.handleBDErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        email: true,
        password: true,
        id: true,
        fullName: true,
        roles: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credeciales no validas');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Credeaciales no validas (password)');
    }

    const { password: pass, ...restUser } = user;

    const userData = {
      id: user.id,
      fullname: user.fullName,
      email: user.email,
      roles: user.roles,
    };

    return {
      userData,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  async findAll() {
    const users = await this.userRepository.find({
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        roles: true,
      },
      order: { fullName: 'ASC' },
    });
    return users;
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      this.handleBDErrors(error);
    }
  }

  async update(id: string, updateAuthDto: UpdateAuthDto) {
    try {
      const user = await this.findOne(id);

      // user.email = updateAuthDto.email ? updateAuthDto.email : user.email;

      // user.password = updateAuthDto.password
      //   ?  bcrypt.hashSync( updateAuthDto.password,10)
      //   : user.password;

      // user.fullName = updateAuthDto.fullName
      //   ? updateAuthDto.fullName
      //   : user.fullName;

      // user.isActive = updateAuthDto.isActive
      //    ? updateAuthDto.isActive
      //    : user.isActive

      //   await this.userRepository.save(user)

      if (updateAuthDto.email) user.email = updateAuthDto.email;
      if (updateAuthDto.fullName) user.fullName = updateAuthDto.fullName;
      if (updateAuthDto.roles) user.roles = updateAuthDto.roles;
      if (updateAuthDto.isActive !== undefined)
        user.isActive = updateAuthDto.isActive;

      if (updateAuthDto.password && updateAuthDto.password.trim() !== '') {
        user.password = bcrypt.hashSync(updateAuthDto.password, 10);
      }

      await this.userRepository.save(user);

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.handleBDErrors(error);
    }
  }

  async remove(id: string) {
    try {
      const user = await this.findOne(id);

      user.isActive = false;

      await this.userRepository.save(user);
      return { message: `Usuario ${user.fullName} desactivado correctamente` };
    } catch (error) {
      this.handleBDErrors(error);
    }
  }

  //funcio privada para crear el jwt del usuario
  private getJwtToken(payload: jwtPayload) {
    //

    const token = this.jwtService.sign(payload);
    return token;
  }

  //fucnjon para manejar errores
  private handleBDErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    throw new InternalServerErrorException('Please check logs');
  }
}
