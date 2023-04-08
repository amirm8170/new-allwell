import {
  HttpException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { UserDto } from 'src/DTO/user.dto';
import { User } from 'src/models/user.model';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDto } from 'src/DTO/change-password.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    private mailerService: MailerService,
    private jwtService: JwtService,
  ) {}

  async signup(userDto: UserDto): Promise<User> {
    const { email, password } = userDto;
    const user = await this.UserModel.findOne({ email });
    //check if username there is not in db.
    if (user) throw new NotAcceptableException('you registered before!');

    //hash password before save in db.
    const hashPassword = bcrypt.hashSync(password, 12);

    //create newUser and save in db.
    const createUser = new this.UserModel({
      email,
      password: hashPassword,
    });
    await createUser.save();

    //return newUser as response
    return createUser;
  }

  async login(
    userDto: UserDto,
    res: Response,
  ): Promise<{ accessToken: string }> {
    const { email, password } = userDto;

    //check if username is valid.
    const user = await this.UserModel.findOne({ email });
    if (!user) throw new NotFoundException('invalid username!');

    //check if password is valid.
    const isPassword = bcrypt.compareSync(password, user.password);
    if (!isPassword) throw new NotFoundException('invalid password!');

    //return accessToken as response and set accessToken in cookie!
    const payload = { email: user.email, sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);
    res.cookie('accessToken', accessToken, {
      secure: true,
      httpOnly: true,
      maxAge: 3600 * 24,
    });
    return { accessToken };
  }

  async sendMailForResetPassword(email: string): Promise<string> {
    //check if username is valid in db
    const isEmail = await this.UserModel.findOne({ email });
    if (!isEmail || !email) throw new NotFoundException('invalid username!');

    //send change password link to the email with nodemailer.
    this.mailerService.sendMail({
      to: email,
      from: 'All-Well',
      subject: 'verification link is ready.',
      template: 'index.ejs',
      context: { id: isEmail.id },
    });

    return 'check your mailbox!';
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    id: string,
  ): Promise<User> {
    //check if password and change password are the same.
    const { password, confirmPassword } = changePasswordDto;
    if (password !== confirmPassword)
      throw new HttpException('passwords are not the same', 400);

    //check id has valid type or no.
    const isId = isValidObjectId(id);
    if (!isId) throw new HttpException('invalid id', 400);

    //hash password before save in db.
    const hashPassword = bcrypt.hashSync(password, 12);

    //check if user is valid in db and if yes, so update password.
    const user = await this.UserModel.findByIdAndUpdate(
      id,
      {
        $set: { password: hashPassword },
      },
      { new: true },
    );
    if (!user) throw new NotFoundException('user not found!');
    return user;
  }

  async checkUserId(id: string): Promise<void> {
    //check type of id is valid.
    const isId = isValidObjectId(id);
    if (!isId) throw new HttpException('invalid id', 400);

    //check if user is valid in db.
    const user = await this.UserModel.findById(id);
    if (!user) throw new NotFoundException('invalid id!');
  }

  logout(res: Response): Response {
    res.clearCookie('accessToken');
    return res.status(200).json({ message: 'logged out' });
  }
}
