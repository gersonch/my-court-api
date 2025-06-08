export class CreateAdminDto {
  name: string
  email: string
  password: string
}

export class CreateComplexDto {
  name: string
  description: string
  city?: string
  country?: string
  address?: string
  image_url?: string
}

export class CreateAdminWithComplexDto {
  admin: CreateAdminDto
  complex: CreateComplexDto
}
