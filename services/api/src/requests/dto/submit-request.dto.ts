import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REQUEST_TYPES = [
  'quote',
  'project',
  'site-inspection',
  'property',
  'land',
  'sales',
  'consultation',
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const CONTACT_METHODS = ['phone', 'email', 'whatsapp'] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

/**
 * Public website request payload. Mapped onto a CRM Lead on submission, with
 * the request-specific fields stored as structured JSON in `Lead.notes`.
 */
export class SubmitRequestDto {
  @IsIn(REQUEST_TYPES)
  requestType!: RequestType;

  @IsString()
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  projectType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  service?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  budgetRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  preferredLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsIn(CONTACT_METHODS)
  preferredContactMethod?: ContactMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachmentName?: string;
}
