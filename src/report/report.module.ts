// Anthony Alexis
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Report, ReportSchema } from './report.schema';
import { User, UserSchema } from 'src/user/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Report.name, schema: ReportSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    providers: [ReportService],
    controllers: [ReportController],
    exports: [ReportService],
})
export class ReportModule { }