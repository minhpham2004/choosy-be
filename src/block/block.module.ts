import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Block, BlockSchema } from './block.schema';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Block.name, schema: BlockSchema }]),
    ],
    controllers: [BlockController],
    providers: [BlockService],
    exports: [BlockService],
})
export class BlockModule { }