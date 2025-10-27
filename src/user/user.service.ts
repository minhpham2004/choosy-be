// Minh Pham & Anthony Alexis
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
    ) { }

    async create(dto: CreateUserDto) {
        const email = dto.email.trim().toLowerCase();
        const name = dto.name?.trim();

        if (await this.userModel.exists({ email })) {
            throw new ConflictException('Email already exists');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

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
            displayName: name || created!.name || 'Unnamed',
            status: created!.status || 'active',
            createdAt: created!.createdAt,
            updatedAt: created!.updatedAt,
        };
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
            const emailOwner = await this.userModel.findOne({ email: dto.email }).lean();
            if (emailOwner && String(emailOwner._id) !== id) {
                throw new ConflictException('Email already in use');
            }
        }
        const updated = await this.userModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true }).lean();
        if (!updated) throw new NotFoundException('User not found');
        return updated;
    }

    async remove(id: string) {
        const res = await this.userModel.findByIdAndDelete(id).lean();
        if (!res) throw new NotFoundException('User not found');

        await this.profileModel.deleteOne({ userId: new Types.ObjectId(id) }).exec();
        return { deleted: true };
    }

    async searchUsers(query: string) {
        if (!query || !query.trim()) return [];

        const idMatch = Types.ObjectId.isValid(query) ? new Types.ObjectId(query) : null;
        const regex = new RegExp(query, 'i');

        const filter: FilterQuery<UserDoc> = idMatch
            ? { $or: [{ _id: idMatch }, { name: regex }, { email: regex }] }
            : { $or: [{ name: regex }, { email: regex }] };

        const users = await this.userModel.find(filter).limit(10).lean();
        if (!users.length) return [];

        const userIds = users.map(u => u._id);
        const profiles = await this.profileModel.find({ userId: { $in: userIds } }).select('userId displayName').lean();
        const profileByUserId = new Map<string, any>();
        for (const p of profiles) profileByUserId.set(String(p.userId), p);

        return users.map(u => ({
            _id: u._id,
            displayName: profileByUserId.get(String(u._id))?.displayName || u.name || 'Unnamed',
            email: u.email,
            status: (u as any).status || 'active',
        }));
    }

    async updateStatus(id: string, status: 'active' | 'banned') {
        const updated = await this.userModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
        if (!updated) throw new NotFoundException('User not found');
        return updated;
    }
}
