import { Injectable } from '@nestjs/common'

@Injectable()
export class ReservationsService {
  findAll() {
    return `This action returns all reservations`
  }

  findOne(id: number) {
    return `This action returns a #${id} reservation`
  }

  remove(id: number) {
    return `This action removes a #${id} reservation`
  }
}
