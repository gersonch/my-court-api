import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common'
import { FieldsService } from './fields.service'
import { CreateFieldDto } from './dto/create-field.dto'

import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { PaginationQueryDto } from 'src/common/dto/pagination.dto'

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Auth(Role.OWNER)
  @Post('')
  createField(@Body() createFieldDto: CreateFieldDto) {
    return this.fieldsService.createField(createFieldDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fieldsService.findById(id)
  }
  @Get('complex/:complexId')
  getFieldsByComplex(@Param('complexId') complexId: string, @Query() pagination: PaginationQueryDto) {
    return this.fieldsService.getFieldsByComplexPaginated(complexId, pagination.page, pagination.limit)
  }
}
