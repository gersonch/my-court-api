import { IsOptional, IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO para paginación estilo "Load More" / Infinite Scroll
 * Uso: GET /endpoint?page=1&limit=10
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10
}

/**
 * Wrapper genérico para responses paginados
 * @example
 * {
 *   data: [...],
 *   pagination: {
 *     page: 1,
 *     limit: 10,
 *     totalItems: 45,
 *     totalPages: 5,
 *     hasMore: true
 *   }
 * }
 */
export class PaginationMetaDto {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasMore: boolean

  constructor(page: number, limit: number, totalItems: number) {
    this.page = page
    this.limit = limit
    this.totalItems = totalItems
    this.totalPages = Math.ceil(totalItems / limit)
    this.hasMore = page < this.totalPages
  }
}

/**
 * Helper para crear response paginado
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): { data: T[]; pagination: PaginationMetaDto } {
  return {
    data,
    pagination: new PaginationMetaDto(page, limit, total),
  }
}
