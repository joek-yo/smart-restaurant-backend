import { IsString, IsOptional } from 'class-validator';

export class StartCheckoutDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  channel?: string;
}
