// Minh Pham & Nathan Ravasini
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
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
    const user = await this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash') // Include the passwordHash field (usually excluded)
      .lean();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Compare provided password with stored hash
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // Exclude passwordHash before returning user
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async login(email: string, password: string) {
    const user = await this.validateUserByEmail(email, password);

    const payload = { sub: String(user._id), email: user.email }; // JWT payload: user ID (as 'sub') and email
    const accessToken = await this.jwtService.signAsync(payload); // Generate access token

    return { user, accessToken };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    // Find user by ID and include password hash
    const user = await this.userModel.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundException('User not found');

    // Verify current password
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid current password');

    // Generate salt and hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    // Save updated password to DB
    await user.save();

    return { ok: true };
  }

  async reauth(userId: string, password: string) {
    // Fetch user by ID and include password hash
    const user = await this.userModel.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundException('User not found');

    // Validate provided password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid password');

    return { ok: true };
  }
}
