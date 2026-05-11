import { IsString, IsOptional } from 'class-validator';

export class ConfirmCheckoutDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}
