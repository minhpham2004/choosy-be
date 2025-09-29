import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDoc } from './profile.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDoc>,
  ) {}

  async create(data: Partial<Profile>): Promise<Profile> {
    const profile = new this.profileModel(data);
    return profile.save();
  }

  async findById(id: string): Promise<Profile> {
    const profile = await this.profileModel.findById(id).exec();
    if (!profile) throw new NotFoundException(`Profile ${id} not found`);
    return profile;
  }

  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile)
      throw new NotFoundException(`Profile for user ${userId} not found`);
    return profile;
  }

  async update(userId: string, update: Partial<Profile>): Promise<Profile> {
    const profile = await this.profileModel
      .findOneAndUpdate({ userId }, { $set: update }, { new: true })
      .exec();
    if (!profile)
      throw new NotFoundException(`Profile for user ${userId} not found`);
    return profile;
  }

  async delete(userId: string): Promise<void> {
    await this.profileModel.deleteOne({ userId }).exec();
  }

  async listDiscoverable(): Promise<Profile[]> {
    return this.profileModel.find({ discoverable: true }).exec();
  }
}
