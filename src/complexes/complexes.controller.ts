import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common'
import { ComplexesService } from './complexes.service'
import { createComplexesDto } from './dto/create-complexes.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'

@Controller('complexes')
export class ComplexesController {
  constructor(private readonly complexService: ComplexesService) {}

  @Auth(Role.ADMIN)
  @Post()
  async create(@Body() body: createComplexesDto) {
    //check if the user is role owner
    const isOwner = await this.complexService.userHasRoleOwner(body.owner)
    if (!isOwner) {
      throw new BadRequestException('User is not an owner')
    }
    // check if the user already has a complex
    const alreadyHas = await this.complexService.userHasComplex(body.owner)
    if (alreadyHas) {
      throw new BadRequestException('User already has a complex')
    }

    return this.complexService.create(body)
  }

  @Get()
  findAll() {
    return this.complexService.findAll()
  }

  @Get('id')
  getIdForEmail() {
    return 'hola'
  }
}
