import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AdminService } from './admin.service'
import { CreateAdminWithComplexDto } from './dto/create-admin-with-complex.dto'
import { ApiKeyGuard } from 'src/common/guards/api-key.guard'

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  async createAdminWithComplex(@Body() dto: CreateAdminWithComplexDto) {
    return this.adminService.createAdminWithComplex(dto)
  }
}
