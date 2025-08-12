import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { FieldsService } from './fields.service'
import { CreateFieldDto } from './dto/create-field.dto'

import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'

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
  getFieldsByComplex(@Param('complexId') complexId: string) {
    return this.fieldsService.getFieldsByComplex(complexId)
  }
}
