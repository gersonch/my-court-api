import {
  Controller,
  Get,
  Post,
  Body, //
  Param,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Role } from 'src/common/guards/enums/rol.enum'
import { UserProfileDto } from './dto/user-profile.dto'
import { CloudinaryFileInterceptor } from 'src/complexes/decorators/cloudinary-interceptor.decorator'
interface MulterFileWithPath extends Express.Multer.File {
  path: string
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto)
  }

  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @Auth(Role.USER)
  @Get(':id')
  getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserProfile(id)
  }

  @Auth(Role.USER)
  @Patch(':id')
  updateUserProfile(@Param('id') id: string, @Body() userProfile: Partial<UserProfileDto>) {
    return this.usersService.updateUserProfile(id, userProfile)
  }

  @Auth(Role.USER)
  @Patch(':id/image')
  @UseInterceptors(CloudinaryFileInterceptor())
  updateUserImage(@Param('id') id: string, @UploadedFile() file: MulterFileWithPath) {
    if (!file || !file.path) {
      throw new Error('File or file path is missing')
    }
    return this.usersService.updateImageUrl(id, file.path)
  }

  @Auth(Role.USER)
  @Patch(':id/delete-image')
  async deleteUserImage(@Param('id') id: string) {
    return this.usersService.deleteUserImage(id)
  }
}
