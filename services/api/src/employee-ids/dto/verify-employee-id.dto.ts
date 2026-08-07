import { IsString, Length } from 'class-validator';

/**
 * Public QR verification payload. `card` is the card's unique number and `t` is
 * the opaque one-time token minted at issue time and embedded in the card's QR.
 */
export class VerifyEmployeeIdDto {
  @IsString()
  @Length(1, 64)
  card!: string;

  @IsString()
  @Length(1, 256)
  t!: string;
}