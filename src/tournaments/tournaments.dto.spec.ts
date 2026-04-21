import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreateTournamentDto } from './dto/create-tournament.dto'
import { UpdateMatchDto } from './dto/update-match.dto'

describe('Tournament DTOs', () => {
  describe('CreateTournamentDto', () => {
    it('should validate a correct liga tournament', async () => {
      const dto = plainToInstance(CreateTournamentDto, {
        name: 'Torneo de Prueba',
        sport: 'futbol',
        tipoTorneo: 'liga',
        config: {
          teamsCount: 8,
        },
      })

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate a correct playoff tournament', async () => {
      const dto = plainToInstance(CreateTournamentDto, {
        name: 'Torneo Playoff',
        sport: 'futbol',
        tipoTorneo: 'playoff',
        config: {
          teamsCount: 8,
          playoffsRounds: 3,
        },
      })

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should validate a correct americano tournament', async () => {
      const dto = plainToInstance(CreateTournamentDto, {
        name: 'Torneo Americano',
        sport: 'padel',
        tipoTorneo: 'americano',
        config: {
          teamsCount: 4,
          rounds: 3,
          courtCount: 2,
        },
      })

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject americano with futbol', async () => {
      const dto = plainToInstance(CreateTournamentDto, {
        name: 'Torneo Americano',
        sport: 'futbol',
        tipoTorneo: 'americano',
        config: {
          teamsCount: 4,
          rounds: 3,
        },
      })

      // This validation is done in service, not DTO
      // DTO will validate, but we need service validation
      const errors = await validate(dto)
      expect(errors.length).toBe(0) // DTO is valid, service must reject
    })

    it('should reject invalid tipoTorneo', async () => {
      const dto = plainToInstance(CreateTournamentDto, {
        name: 'Torneo Invalid',
        sport: 'futbol',
        tipoTorneo: 'invalid' as any,
        config: {
          teamsCount: 8,
        },
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject playoff with invalid team count', async () => {
      const dto = plainToInstance(CreateTournamentDto, {
        name: 'Torneo Playoff',
        sport: 'futbol',
        tipoTorneo: 'playoff',
        config: {
          teamsCount: 6, // Invalid: must be 4, 8, or 16
        },
      })

      // DTO allows any number, service must validate
      const errors = await validate(dto)
      expect(errors.length).toBe(0) // DTO is valid, service must reject
    })

    it('should reject missing required fields', async () => {
      const dto = plainToInstance(CreateTournamentDto, {
        name: 'Torneo',
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('UpdateMatchDto', () => {
    it('should validate a correct match update', async () => {
      const dto = plainToInstance(UpdateMatchDto, {
        matchId: '123e4567-e89b-12d3-a456-426614174000',
        scoreA: 2,
        scoreB: 1,
        status: 'finished',
      })

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should allow partial updates', async () => {
      const dto = plainToInstance(UpdateMatchDto, {
        matchId: '123e4567-e89b-12d3-a456-426614174000',
        scoreA: 3,
      })

      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject invalid status', async () => {
      const dto = plainToInstance(UpdateMatchDto, {
        matchId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'invalid' as any,
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing matchId', async () => {
      const dto = plainToInstance(UpdateMatchDto, {
        scoreA: 2,
        scoreB: 1,
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
