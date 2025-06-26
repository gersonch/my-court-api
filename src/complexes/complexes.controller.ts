//prettier-ignore
import { Controller, Get, Post, Body, BadRequestException, Put, UseInterceptors, UploadedFile, Patch, Param } from '@nestjs/common'
import { ComplexesService } from './complexes.service'
import { createComplexesDto, updateComplexDto } from './dto/create-complexes.dto'
import { Auth } from 'src/auth/decorators/auth-passport.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { ActiveUser } from 'src/common/decorators/active-user.decorator'
import { IUserActive } from 'src/common/interfaces/user-active.interface'
import { CloudinaryFileInterceptor } from './decorators/cloudinary-interceptor.decorator'
import { RatingService } from 'src/rating/rating.service'

interface MulterFileWithPath extends Express.Multer.File {
  path: string
}

@Controller('complexes')
export class ComplexesController {
  constructor(
    private readonly complexService: ComplexesService,
    private readonly ratingService: RatingService,
  ) {}

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

  @Auth(Role.OWNER)
  @Put('add-image')
  @UseInterceptors(CloudinaryFileInterceptor())
  async addImageUrl(@ActiveUser() user: IUserActive, @UploadedFile() file: MulterFileWithPath) {
    console.log(user)
    if (!file || !file.path) {
      throw new BadRequestException('No se subió ningún archivo')
    }

    return this.complexService.addImageUrl(user.sub, file.path)
  }

  @Patch('delete-image')
  @Auth(Role.OWNER)
  async deleteImageUrl(@ActiveUser() user: IUserActive, @Body('image-url') imageUrl: string) {
    return this.complexService.deleteImageUrl(user.sub, imageUrl)
  }

  @Auth(Role.OWNER)
  @Patch('update')
  updateComplex(@Body() body: updateComplexDto, @ActiveUser() user: IUserActive) {
    if (!body || Object.keys(body).length === 0) {
      throw new BadRequestException('No se proporcionaron datos para actualizar el complejo')
    }

    return this.complexService.updateComplex(body, user.sub)
  }

  @Auth(Role.OWNER)
  @Get(':complexId')
  findById(@Param('complexId') complexId: string, @ActiveUser() user: IUserActive) {
    return this.complexService.findById(complexId, user.sub)
  }
}
