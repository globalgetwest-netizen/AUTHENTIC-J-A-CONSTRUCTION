import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../common/auth/public.decorator';
import { RequestsService, type RequestReference } from './requests.service';
import { SubmitRequestDto } from './dto/submit-request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitRequestDto): Promise<RequestReference> {
    return this.requestsService.submit(dto);
  }
}