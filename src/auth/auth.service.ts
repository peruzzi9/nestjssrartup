import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from '@user/dto/user.create.dto';
import { RegistrationStatus } from './interfaces/regisration-status.interface';
import { UsersService } from '@user/users.service';
import { LoginStatus } from './interfaces/login-status.interface';
import { LoginUserDto } from '../users/dto/user-login.dto';
import { UserDto } from '@user/dto/user.dto';
import { JwtPayload } from './interfaces/payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(userDto: CreateUserDto): Promise<RegistrationStatus> {
    let status: RegistrationStatus = {
      code: 200,
      message: 'user registered',
    };

    
    const result=  await this.usersService.create(userDto);
    if (result.error)   
    status = {
        code: 400,
        error: result.error,
       }

    return status;
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginStatus> {
    // find user in db
    const result = await this.usersService.findByLogin(loginUserDto);

    // if user not exist or wrong password then response will be sent from inside usersService.findByLogin
    console.log("response === ",result)
    if (!result.error)
    {
     // generate and sign token
     const token = this._createToken(result.user); 
     return {
      code:200,
      email: result.user.email,
      ...token,
    };
    }
    
    return {code:400,...result};
   
  }

  /* 
   Remember that from above, validateUser function is called by the JwtStrategy.validate() function
   once a token is validated by Passport.js middleware.
  */
  async validateUser(payload: JwtPayload): Promise<UserDto> {
    const user = await this.usersService.findByPayload(payload); 
    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  private _createToken({ id }: UserDto): any {
    const expiresIn = process.env.JWT_EXPIRESIN;

    const user: JwtPayload = { id };
    const accessToken = this.jwtService.sign(user);
    return {
      expiresIn,
      accessToken,
    };
  }
}
