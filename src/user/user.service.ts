import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { User, UserDoc } from './user.schema';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { Profile, ProfileDoc } from 'src/profile/profile.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDoc>,
    @InjectModel(Profile.name) private readonly profileModel: Model<ProfileDoc>,
  ) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name?.trim();

    if (await this.userModel.exists({ email })) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const doc = await this.userModel.create({ email, name, passwordHash });

      await this.profileModel.create({
        userId: doc._id,
        displayName: name || email.split('@')[0],
        age: dto.age,
        interests: dto.interests,
        areaKey: dto.areaKey,
        discoverable: true,
        prefs: {
          minAge: 18,
          maxAge: 99,
          allowedAreas: [],
          maxDistanceTier: 'near',
        },
      });

      const created = await this.userModel.findById(doc._id).lean();

      return {
        _id: created!._id,
        email: created!.email,
        name: created!.name ?? null,
        createdAt: created!.createdAt,
        updatedAt: created!.updatedAt,
      };
    } catch (err: any) {
      if (
        err?.code === 11000 &&
        (err?.keyPattern?.email || err?.keyValue?.email)
      ) {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }

  async findAll() {
    return this.userModel.find().lean();
  }

  async findOne(id: string) {
    const doc = await this.userModel.findById(id).lean();
    if (!doc) throw new NotFoundException('User not found');
    return doc;
  }

  async update(id: string, dto: UpdateUserDto) {
    if (dto.email) {
      const emailOwner = await this.userModel
        .findOne({ email: dto.email })
        .lean();
      if (emailOwner && String(emailOwner._id) !== id) {
        throw new ConflictException('Email already in use');
      }
    }
    const updated = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string) {
    const res = await this.userModel.findByIdAndDelete(id).lean();
    if (!res) throw new NotFoundException('User not found');

    await this.profileModel
      .deleteOne({ userId: new Types.ObjectId(id) })
      .exec();

    return { deleted: true };
  }
}
