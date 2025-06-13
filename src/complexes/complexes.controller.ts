//prettier-ignore
import { Controller, Get, Post, Body, BadRequestException, Put, UseInterceptors, UploadedFile } from '@nestjs/common'
import { ComplexesService } from './complexes.service'
import { createComplexesDto } from './dto/create-complexes.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'
import { CloudinaryFileInterceptor } from './decorators/cloudinary-interceptor.decorator'

@Auth(Role.OWNER)
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

  @Put('add-image')
  @UseInterceptors(CloudinaryFileInterceptor())
  async addImageUrl(@ActiveUser() user: IUserActive, @UploadedFile() file: Express.Multer.File) {
    if (!file || !file.path) {
      throw new BadRequestException('No se subió ningún archivo')
    }

    return this.complexService.addImageUrl(user.sub, file.path)
  }
}
