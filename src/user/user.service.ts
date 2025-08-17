import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User, UserDoc } from './user.schema';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDoc>,
  ) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name?.trim();

    // Soft pre-check (nice UX, but still handle race with E11000 below)
    if (await this.userModel.exists({ email })) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const doc = await this.userModel.create({ email, name, passwordHash });

      // Read back as lean to ensure passwordHash never leaks
      const created = await this.userModel.findById(doc._id).lean();

      return {
        _id: created!._id,
        email: created!.email,
        name: created!.name ?? null,
        createdAt: created!.createdAt,
        updatedAt: created!.updatedAt,
      };
    } catch (err: any) {
      // Handle unique index race condition
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
    return { deleted: true };
  }
}
