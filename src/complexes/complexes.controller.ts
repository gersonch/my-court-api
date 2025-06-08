import { Controller, Get, Post, Body } from '@nestjs/common'
import { ComplexesService } from './complexes.service'
import { IComplex } from 'src/types/complexes'

@Controller('complexes')
export class ComplexesController {
  constructor(private readonly complexService: ComplexesService) {}

  @Post()
  create(@Body() body: IComplex) {
    return this.complexService.create(body)
  }

  @Get()
  findAll() {
    return this.complexService.findAll()
  }
}
