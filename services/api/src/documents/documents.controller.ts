import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { documentsDiskStorage } from '../common/storage/uploads';
import { DocumentsService } from './documents.service';
import {
  AddDocumentVersionDto,
  CreateDocumentDto,
  GrantDocumentAccessDto,
  QueryDocumentsDto,
  UpdateDocumentStatusDto,
} from './dto/documents.dto';

const UPLOAD_OPTIONS = {
  storage: documentsDiskStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
};

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequirePermissions('documents.read')
  list(@Query() query: QueryDocumentsDto) {
    return this.documentsService.list(query);
  }

  @Get(':id')
  @RequirePermissions('documents.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.get(id);
  }

  @Post()
  @RequirePermissions('documents.write')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTIONS))
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.create(dto, user, file);
  }

  @Post(':id/versions')
  @RequirePermissions('documents.write')
  @UseInterceptors(FileInterceptor('file', UPLOAD_OPTIONS))
  addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddDocumentVersionDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.addVersion(id, dto, user, file);
  }

  @Post(':id/status')
  @RequirePermissions('documents.write')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentStatusDto,
  ) {
    return this.documentsService.updateStatus(id, dto);
  }

  @Post(':id/access')
  @RequirePermissions('documents.write')
  grantAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GrantDocumentAccessDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentsService.grantAccess(id, dto, user);
  }

  @Delete(':id/access/:principalType/:principalId')
  @RequirePermissions('documents.write')
  revokeAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('principalType') principalType: string,
    @Param('principalId') principalId: string,
  ) {
    return this.documentsService.revokeAccess(id, principalType, principalId);
  }

  @Delete(':id')
  @RequirePermissions('documents.write')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }
}