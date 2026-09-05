import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { RepositorySourceType } from '../../../domain/models/enums';

export class AnalyzeByUrlDto {
  @ApiProperty({
    example: 'https://github.com/usuario/proyecto-demo',
    description: 'HTTPS URL of a public Git repository (GitHub supported in MVP).',
  })
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  url!: string;
}

export class AnalyzeRequestDto {
  @ApiProperty({ enum: RepositorySourceType, example: RepositorySourceType.URL })
  @IsEnum(RepositorySourceType)
  type!: RepositorySourceType;

  @ApiProperty({ required: false, description: 'Required when type=url' })
  @IsOptional()
  @IsString()
  url?: string;
}