import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Block, BlockDoc } from './block.schema';
import { CreateBlockDto } from './dtos/create-block.dto';

@Injectable()
export class BlockService {
    constructor(
        @InjectModel(Block.name)
        private readonly blockModel: Model<BlockDoc>,
    ) { }

    async blockUser(blockerId: string, dto: CreateBlockDto) {
        if (blockerId === dto.blockedId) {
            throw new ConflictException('Cannot block yourself');
        }

        const blocker = new Types.ObjectId(blockerId);
        const blocked = new Types.ObjectId(dto.blockedId);

        const existing = await this.blockModel
            .findOne({ blocker, blocked })
            .lean();

        if (existing) {
            throw new ConflictException('User already blocked');
        }

        const block = await this.blockModel.create({ blocker, blocked });
        return block.toObject();
    }

    async getBlockedUsers(blockerId: string) {
        return this.blockModel
            .find({ blocker: new Types.ObjectId(blockerId) })
            .populate('blocked', 'email name')
            .lean();
    }

    async isBlocked(blockerId: string, targetId: string) {
        return !!(await this.blockModel.exists({
            blocker: new Types.ObjectId(blockerId),
            blocked: new Types.ObjectId(targetId),
        }));
    }
}
