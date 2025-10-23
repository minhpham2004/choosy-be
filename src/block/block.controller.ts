import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
    Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { BlockService } from './block.service';
import { CreateBlockDto } from './dtos/create-block.dto';

@Controller('block')
@UseGuards(JwtAuthGuard)
export class BlockController {
    constructor(private readonly blockService: BlockService) { }

    @Post()
    async blockUser(@Req() req, @Body() dto: CreateBlockDto) {
        return this.blockService.blockUser(req.user.userId, dto);
    }

    @Get()
    async getBlockedUsers(@Req() req) {
        return this.blockService.getBlockedUsers(req.user.userId);
    }

    @Get(':targetId')
    async checkIfBlocked(@Req() req, @Param('targetId') targetId: string) {
        const isBlocked = await this.blockService.isBlocked(
            req.user.userId,
            targetId,
        );
        return { blocked: isBlocked };
    }
}