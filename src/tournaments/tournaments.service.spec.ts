import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { TournamentsService } from './tournaments.service'

describe('TournamentsService - Americano', () => {
  let service: TournamentsService
  let mockTournamentModel: any
  let mockUserModel: any
  let mockComplexModel: any

  beforeEach(async () => {
    mockTournamentModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOne: jest.fn(),
    }

    mockUserModel = {
      findById: jest.fn().mockImplementation((id: string) => ({
        exec: () => Promise.resolve({ _id: id, name: `User ${id}` }),
      })),
      find: jest.fn().mockImplementation((query: any) => {
        if (query._id && query._id.$in) {
          const ids = query._id.$in
          return {
            lean: () => Promise.resolve(ids.map((id: string) => ({ _id: id, name: `User ${id}` }))),
          }
        }
        return { lean: () => Promise.resolve([]) }
      }),
    }

    mockComplexModel = {
      findOne: jest.fn().mockImplementation(() => ({
        exec: () => Promise.resolve({ _id: 'complex-123', owner: 'owner-1' }),
      })),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        { provide: getModelToken('Tournament'), useValue: mockTournamentModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Complex'), useValue: mockComplexModel },
      ],
    }).compile()

    service = module.get<TournamentsService>(TournamentsService)
  })

  describe('addPlayers', () => {
    it('should validate odd number of players', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        tournamentType: 'americano',
        state: 'open',
      })

      const playersData = {
        players: [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }],
      }

      await expect(service.addPlayers('tournament-123', playersData)).rejects.toThrow(
        'Americano requires an even number of players',
      )
    })

    it('should validate invalid player count', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        tournamentType: 'americano',
        state: 'open',
      })

      const playersData = {
        players: [
          { userId: 'user-1' },
          { userId: 'user-2' },
          { userId: 'user-3' },
          { userId: 'user-4' },
          { userId: 'user-5' },
        ],
      }

      await expect(service.addPlayers('tournament-123', playersData)).rejects.toThrow(
        'Americano requires an even number of players',
      )
    })

    it('should validate non-americano tournament', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        tournamentType: 'liga',
        state: 'open',
      })

      const playersData = { players: [] }

      await expect(service.addPlayers('tournament-123', playersData)).rejects.toThrow(
        'This endpoint is only for americano tournaments',
      )
    })

    it('should validate closed tournament', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        tournamentType: 'americano',
        state: 'closed',
      })

      const playersData = { players: [] }

      await expect(service.addPlayers('tournament-123', playersData)).rejects.toThrow(
        'Tournament must be open to add players',
      )
    })
  })

  describe('generateScheduleAmericano', () => {
    it('should reject non-americano tournament', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        tournamentType: 'liga',
        state: 'open',
      })

      await expect(service.generateScheduleAmericano('tournament-123')).rejects.toThrow(
        'This method is only for americano tournaments',
      )
    })

    it('should reject closed tournament', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        tournamentType: 'americano',
        state: 'closed',
      })

      await expect(service.generateScheduleAmericano('tournament-123')).rejects.toThrow(
        'Tournament must be open to generate schedule',
      )
    })

    it('should reject if no players registered', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        tournamentType: 'americano',
        state: 'open',
        config: { courtCount: 1 },
        ranking: [],
      })

      await expect(service.generateScheduleAmericano('tournament-123')).rejects.toThrow(
        'No players registered',
      )
    })

    it('should generate schedule with players', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        tournamentType: 'americano',
        state: 'open',
        config: { teamsCount: 4, rounds: 3, courtCount: 1 },
        ranking: [
          { playerId: 'user-1', playerName: 'Player 1', points: 0, gamesPlayed: 0 },
          { playerId: 'user-2', playerName: 'Player 2', points: 0, gamesPlayed: 0 },
          { playerId: 'user-3', playerName: 'Player 3', points: 0, gamesPlayed: 0 },
          { playerId: 'user-4', playerName: 'Player 4', points: 0, gamesPlayed: 0 },
        ],
      })

      const result = await service.generateScheduleAmericano('tournament-123')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('getScheduleAmericano', () => {
    it('should reject non-americano tournament', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        tournamentType: 'liga',
      })

      await expect(service.getScheduleAmericano('tournament-123')).rejects.toThrow(
        'This method is only for americano tournaments',
      )
    })
  })

  describe('getRankingAmericano', () => {
    it('should reject non-americano tournament', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        tournamentType: 'liga',
      })

      await expect(service.getRankingAmericano('tournament-123')).rejects.toThrow(
        'This method is only for americano tournaments',
      )
    })

    it('should return sorted ranking by points', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        tournamentType: 'americano',
        ranking: [
          { playerId: 'user-1', playerName: 'Player 1', points: 10, gamesPlayed: 2 },
          { playerId: 'user-2', playerName: 'Player 2', points: 30, gamesPlayed: 2 },
          { playerId: 'user-3', playerName: 'Player 3', points: 20, gamesPlayed: 2 },
        ],
      })

      const result = await service.getRankingAmericano('tournament-123')

      expect(result[0].points).toBe(30)
      expect(result[1].points).toBe(20)
      expect(result[2].points).toBe(10)
    })
  })

  describe('updateMatchAmericano', () => {
    it('should reject non-Americans tournament', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        tournamentType: 'liga',
      })

      await expect(
        service.updateMatchAmericano('tournament-123', 0, { pointsA: 16 }),
      ).rejects.toThrow('This method is only for americano tournaments')
    })

    it('should reject invalid match index', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        tournamentType: 'americano',
        schedule: [{ round: 1 }],
      })

      await expect(
        service.updateMatchAmericano('tournament-123', 999, { pointsA: 16 }),
      ).rejects.toThrow('Match not found')
    })
  })

  describe('subscribe', () => {
    it('should subscribe user to tournament', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        state: 'open',
        subscribers: [],
      })

      const result = await service.subscribe('tournament-123', 'user-1')

      expect(result.status).toBe('pending')
      expect(mockTournamentModel.findByIdAndUpdate).toHaveBeenCalled()
    })

    it('should reject if tournament is not open', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        state: 'closed',
      })

      await expect(service.subscribe('tournament-123', 'user-1')).rejects.toThrow(
        'Tournament is not open for subscriptions',
      )
    })

    it('should reject if already subscribed', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        state: 'open',
        subscribers: [{ userId: 'user-1', status: 'pending' }],
      })

      await expect(service.subscribe('tournament-123', 'user-1')).rejects.toThrow(
        'You are already subscribed',
      )
    })
  })

  describe('getMySubscriptionStatus', () => {
    it('should return subscription status', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        subscribers: [{ userId: 'user-1', status: 'pending', subscribedAt: new Date() }],
      })

      const result = await service.getMySubscriptionStatus('tournament-123', 'user-1')

      expect(result.status).toBe('pending')
    })

    it('should return null if not subscribed', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        subscribers: [],
      })

      const result = await service.getMySubscriptionStatus('tournament-123', 'user-1')

      expect(result.status).toBeNull()
    })
  })

  describe('getSubscribers', () => {
    it('should return subscribers with user details', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        subscribers: [
          { userId: 'user-1', status: 'pending', subscribedAt: new Date() },
          { userId: 'user-2', status: 'approved', subscribedAt: new Date() },
        ],
      })

      const result = await service.getSubscribers('tournament-123')

      expect(result).toHaveLength(2)
      expect(result[0].userName).toBeDefined()
    })

    it('should return empty array if no subscribers', async () => {
      mockTournamentModel.findById.mockResolvedValue({
        _id: 'tournament-123',
        subscribers: [],
      })

      const result = await service.getSubscribers('tournament-123')

      expect(result).toHaveLength(0)
    })
  })

  describe('approveSubscriber', () => {
    it('should approve subscriber', async () => {
      mockComplexModel.findOne.mockResolvedValueOnce({ _id: 'complex-123', owner: 'owner-1' })

      mockTournamentModel.findById.mockResolvedValueOnce({
        _id: 'tournament-123',
        subscribers: [{ userId: 'user-1', status: 'pending' }],
      })

      const result = await service.approveSubscriber(
        'tournament-123',
        'owner-1',
        'user-1',
        'approve',
      )

      expect(result.status).toBe('approved')
    })

    it('should reject if subscriber not found', async () => {
      mockComplexModel.findOne.mockResolvedValueOnce({ _id: 'complex-123', owner: 'owner-1' })

      mockTournamentModel.findById.mockResolvedValueOnce({
        _id: 'tournament-123',
        subscribers: [],
      })

      await expect(
        service.approveSubscriber('tournament-123', 'owner-1', 'user-1', 'approve'),
      ).rejects.toThrow('Subscriber not found')
    })
  })

  describe('addApprovedUsers', () => {
    it('should add approved users to ranking', async () => {
      mockComplexModel.findOne.mockResolvedValueOnce({ _id: 'complex-123', owner: 'owner-1' })

      mockTournamentModel.findById.mockResolvedValueOnce({
        _id: 'tournament-123',
        tournamentType: 'americano',
        subscribers: [
          { userId: 'user-1', status: 'approved' },
          { userId: 'user-2', status: 'approved' },
          { userId: 'user-3', status: 'approved' },
          { userId: 'user-4', status: 'approved' },
        ],
        config: { teamsCount: 4 },
        ranking: [],
      })

      const result = await service.addApprovedUsers('tournament-123', 'owner-1')

      expect(result.playersAdded).toBe(4)
      expect(result.ranking).toHaveLength(4)
    })

    it('should reject if no approved users', async () => {
      mockComplexModel.findOne.mockResolvedValueOnce({ _id: 'complex-123', owner: 'owner-1' })

      mockTournamentModel.findById.mockResolvedValueOnce({
        _id: 'tournament-123',
        tournamentType: 'americano',
        subscribers: [],
      })

      await expect(service.addApprovedUsers('tournament-123', 'owner-1')).rejects.toThrow(
        'No approved subscribers to add',
      )
    })
  })
})
