import { IsEnum, IsOptional, IsString } from 'class-validator'

export class SubscribeDto {
  @IsString()
  userId: string
}

export class ApproveSubscriberDto {
  @IsString()
  userId: string

  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject'
}
