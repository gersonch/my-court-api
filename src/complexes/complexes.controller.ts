import { Controller, Get, Post, Body } from '@nestjs/common'
import { ComplexesService } from './complexes.service'
import { createComplexesDto } from './dto/create-complexes.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'

@Auth(Role.ADMIN)
@Controller('complexes')
export class ComplexesController {
  constructor(private readonly complexService: ComplexesService) {}

  @Post()
  create(@Body() body: createComplexesDto) {
    return this.complexService.create(body)
  }

  @Auth(Role.OWNER)
  @Get()
  findAll() {
    return this.complexService.findAll()
  }
}
