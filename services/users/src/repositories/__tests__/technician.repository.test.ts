import { Pool, PoolClient } from 'pg';
import TechnicianRepository from '../technician.repository';
import {
  CreateTechnicianData,
  UpdateTechnicianData,
  TechnicianListQuery,
  CreateScheduleData,
  UpdateScheduleData,
} from '../../models/technician.model';
import { UserRole, UserStatus } from '../../models/user.model';

jest.mock('../../config/database');

describe('TechnicianRepository', () => {
  let technicianRepository: TechnicianRepository;
  let mockQuery: jest.Mock;
  let mockGetClient: jest.Mock;
  let mockClient: Partial<PoolClient>;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockGetClient = jest.fn();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockGetClient.mockResolvedValue(mockClient);

    const Database = require('../../config/database').default;
    Database.getInstance = jest.fn(() => ({
      query: mockQuery,
      getClient: mockGetClient,
    }));

    technicianRepository = new TechnicianRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new technician profile', async () => {
      const techData: CreateTechnicianData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        specialization: 'Electrical',
        certification_level: 'Senior',
        bio: 'Experienced electrician',
        skills: ['wiring', 'troubleshooting'],
        service_radius_km: 50,
        hourly_rate: 75.50,
      };

      const mockTechnician = {
        id: '456e7890-e89b-12d3-a456-426614174001',
        user_id: techData.user_id,
        specialization: techData.specialization,
        certification_level: techData.certification_level,
        rating: 0,
        total_tasks_completed: 0,
        bio: techData.bio,
        skills: techData.skills,
        service_radius_km: techData.service_radius_km,
        hourly_rate: techData.hourly_rate,
        is_available: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockTechnician], rowCount: 1 });

      const result = await technicianRepository.create(techData);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO technicians');
      expect(result).toEqual(mockTechnician);
    });

    it('should throw error if user_id already has technician profile', async () => {
      const techData: CreateTechnicianData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      mockQuery.mockRejectedValue({ code: '23505' }); // Unique violation

      await expect(technicianRepository.create(techData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return technician with user details', async () => {
      const techId = '456e7890-e89b-12d3-a456-426614174001';
      const mockResult = {
        id: techId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        specialization: 'Electrical',
        certification_level: 'Senior',
        rating: 4.5,
        total_tasks_completed: 25,
        bio: 'Experienced',
        skills: ['wiring'],
        service_radius_km: 50,
        hourly_rate: 75.50,
        is_available: true,
        created_at: new Date(),
        updated_at: new Date(),
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'tech@example.com',
          first_name: 'John',
          last_name: 'Technician',
          phone: null,
          role: UserRole.TECHNICIAN,
          status: UserStatus.ACTIVE,
          profile_photo_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          last_login_at: null,
        },
      };

      mockQuery.mockResolvedValue({ rows: [mockResult], rowCount: 1 });

      const result = await technicianRepository.findById(techId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('JOIN users'),
        [techId]
      );
      expect(result).toEqual(mockResult);
    });

    it('should return null if technician not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await technicianRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return technician by user_id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockTechnician = {
        id: '456e7890-e89b-12d3-a456-426614174001',
        user_id: userId,
        specialization: 'Electrical',
        certification_level: 'Senior',
        rating: 4.5,
        total_tasks_completed: 25,
        bio: 'Experienced',
        skills: ['wiring'],
        service_radius_km: 50,
        hourly_rate: 75.50,
        is_available: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockTechnician], rowCount: 1 });

      const result = await technicianRepository.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [userId]
      );
      expect(result).toEqual(mockTechnician);
    });
  });

  describe('findAll', () => {
    it('should return paginated technicians with default pagination', async () => {
      const mockTechnicians = [
        {
          id: '456e7890-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          specialization: 'Electrical',
          certification_level: 'Senior',
          rating: 4.5,
          total_tasks_completed: 25,
          bio: 'Experienced',
          skills: ['wiring'],
          service_radius_km: 50,
          hourly_rate: 75.50,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date(),
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'tech@example.com',
            first_name: 'John',
            last_name: 'Tech',
            phone: null,
            role: UserRole.TECHNICIAN,
            status: UserStatus.ACTIVE,
            profile_photo_url: null,
            created_at: new Date(),
            updated_at: new Date(),
            last_login_at: null,
          },
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockTechnicians, rowCount: 1 });

      const query: TechnicianListQuery = {};
      const result = await technicianRepository.findAll(query);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result.technicians).toEqual(mockTechnicians);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter technicians by specialization', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const query: TechnicianListQuery = { specialization: 'Electrical' };
      await technicianRepository.findAll(query);

      expect(mockQuery.mock.calls[0][0]).toContain('WHERE t.specialization = $1');
    });

    it('should filter technicians by availability', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const query: TechnicianListQuery = { is_available: true };
      await technicianRepository.findAll(query);

      expect(mockQuery.mock.calls[0][0]).toContain('t.is_available = $');
    });

    it('should filter technicians by minimum rating', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '3' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const query: TechnicianListQuery = { min_rating: 4.0 };
      await technicianRepository.findAll(query);

      expect(mockQuery.mock.calls[0][0]).toContain('t.rating >= $');
    });
  });

  describe('update', () => {
    it('should update technician fields', async () => {
      const techId = '456e7890-e89b-12d3-a456-426614174001';
      const updateData: UpdateTechnicianData = {
        specialization: 'HVAC',
        hourly_rate: 85.00,
        is_available: false,
      };

      const mockUpdated = {
        id: techId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        specialization: 'HVAC',
        certification_level: 'Senior',
        rating: 4.5,
        total_tasks_completed: 25,
        bio: 'Experienced',
        skills: ['hvac'],
        service_radius_km: 50,
        hourly_rate: 85.00,
        is_available: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdated], rowCount: 1 });

      const result = await technicianRepository.update(techId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE technicians SET'),
        expect.arrayContaining([techId])
      );
      expect(result).toEqual(mockUpdated);
    });

    it('should return null if technician not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await technicianRepository.update('non-existent-id', { bio: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete technician by id', async () => {
      const techId = '456e7890-e89b-12d3-a456-426614174001';

      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await technicianRepository.delete(techId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM technicians WHERE id = $1'),
        [techId]
      );
      expect(result).toBe(true);
    });

    it('should return false if technician not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await technicianRepository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return technician statistics', async () => {
      const techId = '456e7890-e89b-12d3-a456-426614174001';
      const mockStats = {
        technician_id: techId,
        total_tasks_completed: 50,
        total_hours_worked: 250.5,
        average_rating: 4.7,
        total_revenue: 18787.50,
        tasks_this_month: 8,
        hours_this_month: 40.0,
        revenue_this_month: 3000.00,
      };

      mockQuery.mockResolvedValue({ rows: [mockStats], rowCount: 1 });

      const result = await technicianRepository.getStatistics(techId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [techId]
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('createSchedule', () => {
    it('should create a new schedule entry', async () => {
      const scheduleData: CreateScheduleData = {
        technician_id: '456e7890-e89b-12d3-a456-426614174001',
        date: new Date('2024-12-25'),
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
        notes: 'Normal schedule',
      };

      const mockSchedule = {
        id: '789e0123-e89b-12d3-a456-426614174002',
        ...scheduleData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockSchedule], rowCount: 1 });

      const result = await technicianRepository.createSchedule(scheduleData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO technician_schedules'),
        expect.any(Array)
      );
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('findSchedulesByTechnicianId', () => {
    it('should return schedules for a technician', async () => {
      const techId = '456e7890-e89b-12d3-a456-426614174001';
      const mockSchedules = [
        {
          id: '789e0123-e89b-12d3-a456-426614174002',
          technician_id: techId,
          date: new Date('2024-12-25'),
          start_time: '09:00',
          end_time: '17:00',
          is_available: true,
          notes: 'Normal schedule',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockSchedules, rowCount: 1 });

      const result = await technicianRepository.findSchedulesByTechnicianId(techId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE technician_id = $1'),
        [techId]
      );
      expect(result).toEqual(mockSchedules);
    });

    it('should filter schedules by date range', async () => {
      const techId = '456e7890-e89b-12d3-a456-426614174001';
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await technicianRepository.findSchedulesByTechnicianId(techId, startDate, endDate);

      expect(mockQuery.mock.calls[0][0]).toContain('date >= $2 AND date <= $3');
      expect(mockQuery.mock.calls[0][1]).toEqual([techId, startDate, endDate]);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule entry', async () => {
      const scheduleId = '789e0123-e89b-12d3-a456-426614174002';
      const updateData: UpdateScheduleData = {
        is_available: false,
        notes: 'Sick leave',
      };

      const mockUpdated = {
        id: scheduleId,
        technician_id: '456e7890-e89b-12d3-a456-426614174001',
        date: new Date('2024-12-25'),
        start_time: '09:00',
        end_time: '17:00',
        is_available: false,
        notes: 'Sick leave',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdated], rowCount: 1 });

      const result = await technicianRepository.updateSchedule(scheduleId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE technician_schedules SET'),
        expect.arrayContaining([scheduleId])
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete schedule entry', async () => {
      const scheduleId = '789e0123-e89b-12d3-a456-426614174002';

      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await technicianRepository.deleteSchedule(scheduleId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM technician_schedules WHERE id = $1'),
        [scheduleId]
      );
      expect(result).toBe(true);
    });
  });
});
