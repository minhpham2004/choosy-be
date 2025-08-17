import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from 'src/user/user.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDoc } from 'src/user/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectModel(User.name) private readonly userModel: Model<UserDoc>,
  ) {}

  async validateUserByEmail(email: string, password: string) {
    // explicitly include passwordHash for comparison
    const user = await this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .lean();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // strip hash before returning
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async login(email: string, password: string) {
    const user = await this.validateUserByEmail(email, password);
    const payload = { sub: String(user._id), email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    return { user, accessToken };
  }
}
