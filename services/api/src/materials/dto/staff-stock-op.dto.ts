import { IsIn } from 'class-validator';
import { StockOpDto } from './stock-op.dto';

/** The kind of store operation a staff member records against a material. */
export type StaffStockOpType = 'IN' | 'OUT' | 'ADJUST';

/**
 * A store operation raised from the staff portal: the shared single-warehouse
 * stock body plus which operation is being performed (receive / issue / adjust).
 * The department-scoped service routes IN → receive, OUT → issue, ADJUST → count.
 */
export class StaffStockOpDto extends StockOpDto {
  @IsIn(['IN', 'OUT', 'ADJUST'])
  type!: StaffStockOpType;
}
