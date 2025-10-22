import { Body, Controller, Get, Post, Req, UseGuards, Delete, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { ReportService, ReportWithNames } from './report.service';
import { CreateReportDto } from './dtos/create-report.dto';

@Controller('report')
@UseGuards(JwtAuthGuard)
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Post()
    async create(@Req() req, @Body() dto: CreateReportDto) {
        return this.reportService.create(req.user.userId, dto);
    }

    @Get('user')
    async getUserReports(@Req() req): Promise<ReportWithNames[]> {
        return this.reportService.getUserReports(req.user.userId);
    }

    @Get('all')
    async getAllReports(): Promise<ReportWithNames[]> {
        return this.reportService.getAll();
    }

    @Delete(':id')
    async deleteReport(@Param('id') id: string) {
        return this.reportService.delete(id);
    }
}
