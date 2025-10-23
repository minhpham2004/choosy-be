import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDoc } from './report.schema';
import { CreateReportDto } from './dtos/create-report.dto';
import { User, UserDoc } from 'src/user/user.schema';

export interface ReportWithNames {
    _id: string;
    reason: string;
    status: string;
    reporterName: string;
    reportedName: string;
}

@Injectable()
export class ReportService {
    constructor(
        @InjectModel(Report.name) private readonly reportModel: Model<ReportDoc>,
        @InjectModel(User.name) private readonly userModel: Model<UserDoc>,
    ) { }

    async create(reporterId: string, dto: CreateReportDto) {
        if (reporterId === dto.reportedId) throw new ConflictException("You cannot report yourself");

        const reporterObjectId = new Types.ObjectId(reporterId);
        const reportedObjectId = new Types.ObjectId(dto.reportedId);

        const reportedUser = await this.userModel.findById(dto.reportedId).lean();
        if (!reportedUser) throw new NotFoundException("Reported user not found");

        const existing = await this.reportModel.findOne({ reporterId: reporterObjectId, reportedId: reportedObjectId });
        if (existing) throw new ConflictException("You already reported this user");

        return this.reportModel.create({
            reporterId: reporterObjectId,
            reportedId: reportedObjectId,
            reason: dto.reason,
        });
    }

    async getAll(): Promise<ReportWithNames[]> {
        const reports = await this.reportModel
            .find()
            .populate('reporterId', 'name')
            .populate('reportedId', 'name')
            .lean();

        return reports.map((r) => ({
            _id: r._id.toString(),
            reason: r.reason,
            status: r.status,
            reporterName: (r.reporterId as { name?: string })?.name || 'Unknown',
            reportedName: (r.reportedId as { name?: string })?.name || 'Unknown',
        }));
    }

    async getUserReports(userId: string): Promise<ReportWithNames[]> {
        const reports = await this.reportModel
            .find({ reporterId: new Types.ObjectId(userId) })
            .populate('reporterId', 'name')
            .populate('reportedId', 'name')
            .lean();

        return reports.map((r) => ({
            _id: r._id.toString(),
            reason: r.reason,
            status: r.status,
            reporterName: (r.reporterId as { name?: string })?.name || 'Unknown',
            reportedName: (r.reportedId as { name?: string })?.name || 'Unknown',
        }));
    }

    async delete(reportId: string) {
        const res = await this.reportModel.findByIdAndDelete(reportId).lean();
        if (!res) throw new NotFoundException('Report not found');
        return { deleted: true };
    }
}