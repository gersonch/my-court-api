import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ITournament } from 'src/types/tournaments'
import { CreateTournamentDto } from './dto/create-tournament.dto'
import { User } from 'src/types/user'
import { Complex } from 'src/types/complexes'
import { UpdateTournamentAndOpenDto } from './dto/update-tournament-and-open.dto'

@Injectable()
export class TournamentsService {
  constructor(
    @InjectModel('Tournament') private tournamentModel: Model<ITournament>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Complex') private complexModel: Model<Complex>,
  ) {}

  getComplexByOwner = async (userId: string) => {
    const getComplexIdByOwner = await this.complexModel.findOne({ owner: userId })
    if (!getComplexIdByOwner) {
      throw new BadRequestException('User does not own a complex')
    }
    return getComplexIdByOwner
  }

  getTournamentsByComplex = async (complexId: string) => {
    const tournaments = await this.tournamentModel.find({ complexId })
    if (!tournaments || tournaments.length === 0) {
      throw new BadRequestException('No tournaments found for this complex')
    }
    return tournaments
  }

  async createTournament(
    tournamentData: CreateTournamentDto,
    userId: string, //d
  ): Promise<ITournament> {
    const { name, sport } = tournamentData
    if (!name || !sport) {
      throw new BadRequestException('Tournament name and sport are required')
    }
    // no nombres duplicados
    const existingTournament = await this.tournamentModel.findOne({ name })
    if (existingTournament) {
      throw new BadRequestException('Tournament with this name already exists')
    }

    const getComplexByOwner = await this.getComplexByOwner(userId)

    const newTournament = new this.tournamentModel({
      name,
      sport,
      complexId: getComplexByOwner._id.toString(),
    })
    return newTournament.save()
  }

  async deleteTournament(tournamentId: string, userId: string): Promise<ITournament> {
    const complex = await this.getComplexByOwner(userId)
    if (!complex) {
      throw new BadRequestException('User does not own a complex')
    }

    const tournament = await this.tournamentModel.findOne({ complexId: complex._id })
    if (!tournament) {
      throw new BadRequestException('Tournament not found for this complex')
    }
    if (tournament.state !== 'inactive') {
      throw new BadRequestException('Tournament must be inactive to delete')
    }

    const deletedTournament = await this.tournamentModel.findOneAndDelete({
      _id: tournamentId,
    })
    if (!deletedTournament) {
      throw new BadRequestException('Tournament not found for this complex')
    }
    return deletedTournament
  }

  async updateAndOpenTournament(
    tournamentId: string, //
    userId: string,
    data: UpdateTournamentAndOpenDto,
  ): Promise<UpdateTournamentAndOpenDto> {
    const complex = await this.getComplexByOwner(userId)
    const tournament = await this.tournamentModel.findOne({ complexId: complex._id })

    if (!tournament) {
      throw new BadRequestException('Tournament not found for this complex')
    }

    const updatedTournament = await this.tournamentModel.findOneAndUpdate(
      { _id: tournamentId, complexId: complex._id },
      {
        ...data,
        state: 'open', // Ensure the state is set to 'open'
      },
      { new: true, runValidators: true },
    )

    // Assuming UpdateTournamentAndOpenDto matches the tournament document structure
    return updatedTournament as unknown as UpdateTournamentAndOpenDto
  }
}
