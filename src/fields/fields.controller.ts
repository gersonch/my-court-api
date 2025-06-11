import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { FieldsService } from './fields.service'
import { CreateFieldDto } from './dto/create-field.dto'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Auth(Role.OWNER)
  @Post()
  create(@Body() createFieldDto: CreateFieldDto, @ActiveUser() user: IUserActive) {
    return this.fieldsService.createForOwner(user.userId, createFieldDto)
  }

  @Get()
  findAll() {
    return this.fieldsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(+id)
  }
}
