import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Post,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer'; // eslint-disable-line @typescript-eslint/no-unused-vars
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalysisService } from '../../application/analysis.service';
import { AnalyzeRequestDto, AnalyzeByUrlDto } from './dto/analyze-request.dto';
import { RepositorySourceType } from '../../domain/models/enums';
import { RepositorySource } from '../../domain/ports/repository-fetcher.port';
import { AnalysisResult } from '../../domain/models';

@ApiTags('analysis')
@Controller('v1/analysis')
export class AnalyzeController {
  constructor(private readonly service: AnalysisService) {}

  /** Analyze from a public Git URL. */
  @Post('url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze a public Git repository by HTTPS URL' })
  @ApiResponse({ status: 200, description: 'Analysis produced successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid request.' })
  async analyzeByUrl(@Body() body: AnalyzeByUrlDto): Promise<AnalysisResult> {
    const source: RepositorySource = { type: RepositorySourceType.URL, url: body.url };
    return this.service.analyze(source);
  }

  /** Analyze from an uploaded ZIP archive. */
  @Post('zip')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Analyze a repository provided as a ZIP archive upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  async analyzeByZip(@UploadedFile() file: Express.Multer.File): Promise<AnalysisResult> {
    if (!file) throw new BadRequestException('A ZIP file under field "file" is required.');
    if (!/\.zip$/i.test(file.originalname)) {
      throw new BadRequestException('Only .zip uploads are supported.');
    }
    const source: RepositorySource = {
      type: RepositorySourceType.ZIP,
      zipBuffer: file.buffer,
      zipName: file.originalname,
    };
    return this.service.analyze(source);
  }

  /** Generic endpoint (mainly used by Swagger UI / exploratory calls). */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generic analyzer (URL or ZIP via JSON body)' })
  async analyzeGeneric(@Body() body: AnalyzeRequestDto): Promise<AnalysisResult> {
    if (body.type === RepositorySourceType.URL) {
      return this.service.analyze({ type: RepositorySourceType.URL, url: body.url });
    }
    throw new BadRequestException('Use POST /api/v1/analysis/zip to upload a ZIP file.');
  }
}