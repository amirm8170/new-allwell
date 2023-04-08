import { UserDto } from 'src/DTO/user.dto';
import { AuthService } from './auth.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/models/user.model';
import { ChangePasswordDto } from 'src/DTO/change-password.dto';
import { AuthGuard } from './auth.guards';
import { Response } from 'express';

@Controller('v1')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() userDto: UserDto): Promise<User> {
    return await this.authService.signup(userDto);
  }

  @Post('login')
  async login(
    @Body() userDto: UserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    return await this.authService.login(userDto, res);
  }

  @Post('send-email')
  async sendMailForResetPassword(
    @Body('email') email: string,
  ): Promise<string> {
    return await this.authService.sendMailForResetPassword(email);
  }

  @Put('change-password/:id')
  async changePassword(
    @Body()
    changePasswordDto: ChangePasswordDto,
    @Param('id') id: string,
  ): Promise<User> {
    return await this.authService.changePassword(changePasswordDto, id);
  }

  @UseGuards(AuthGuard)
  @Get('check-auth')
  checkAuth(@Request() req) {
    return req.user;
  }

  @Get('check-id/:id')
  async checkUserId(@Param('id') id: string): Promise<void> {
    await this.authService.checkUserId(id);
  }

  @Get('logout')
  logout(@Res() res: Response): Response {
    return this.authService.logout(res);
  }
}
