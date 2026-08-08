import { IsEnum, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { AccessLevel, DocumentStatus } from '@ajac/database';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export const ACCESS_PERMISSIONS = ['VIEW', 'EDIT'] as const;
export type AccessPermission = (typeof ACCESS_PERMISSIONS)[number];

/**
 * A document link may only be an http(s) URL or a server-relative /path.
 * Rejects `javascript:`, `data:`, protocol-relative `//host`, and other
 * schemes — the value is rendered in an <a href>, so it must be inert.
 */
const SAFE_URL = /^(https?:\/\/[^\s]+|\/[^\s/][^\s]*)$/;

/** Query params for the documents library. */
export class QueryDocumentsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  category?: string;
}

/** Fields for creating a document. Uploads arrive as multipart/form-data. */
export class CreateDocumentDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entity?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  /** Alternative to uploading a file: link an external URL. */
  @IsOptional()
  @IsString()
  @Matches(SAFE_URL, {
    message: 'url must be an http(s):// link or a server-relative /path',
  })
  @MaxLength(1000)
  url?: string;
}

/** Optional note attached to a newly uploaded version. */
export class AddDocumentVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  /** Alternative to uploading a file: link an external URL as this version. */
  @IsOptional()
  @IsString()
  @Matches(SAFE_URL, {
    message: 'url must be an http(s):// link or a server-relative /path',
  })
  @MaxLength(1000)
  url?: string;
}

export class UpdateDocumentStatusDto {
  @IsEnum(DocumentStatus)
  status!: DocumentStatus;
}

export class GrantDocumentAccessDto {
  @IsIn(['CLIENT', 'STAFF', 'ROLE', 'USER'])
  principalType!: 'CLIENT' | 'STAFF' | 'ROLE' | 'USER';

  @IsString()
  @MaxLength(120)
  principalId!: string;

  @IsOptional()
  @IsIn(ACCESS_PERMISSIONS)
  permission?: AccessPermission;
}