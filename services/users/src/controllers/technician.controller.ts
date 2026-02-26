import { Request, Response } from 'express';
import TechnicianRepository from '../repositories/technician.repository';
import RedisClient from '../config/redis';
import { CreateTechnicianData, UpdateTechnicianData, TechnicianListQuery, CreateScheduleData, UpdateScheduleData } from '../models/technician.model';

class TechnicianController {
  private technicianRepository: TechnicianRepository;
  private redisClient: RedisClient;
  private readonly CACHE_TTL = 3600;

  constructor() {
    this.technicianRepository = new TechnicianRepository();
    this.redisClient = RedisClient.getInstance();
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const techData: CreateTechnicianData = req.body;
      const technician = await this.technicianRepository.create(techData);

      res.status(201).json({
        message: 'Technician profile created successfully',
        technician,
      });
    } catch (error: any) {
      console.error('Error creating technician:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create technician profile' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const cacheKey = `technician:${id}`;
      const cached = await this.redisClient.get(cacheKey);

      if (cached) {
        res.json({ technician: JSON.parse(cached) });
        return;
      }

      const technician = await this.technicianRepository.findById(id);

      if (!technician) {
        res.status(404).json({ error: 'Technician not found' });
        return;
      }

      await this.redisClient.set(cacheKey, JSON.stringify(technician), this.CACHE_TTL);

      res.json({ technician });
    } catch (error) {
      console.error('Error fetching technician:', error);
      res.status(500).json({ error: 'Failed to fetch technician' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const query: TechnicianListQuery = req.query;

      // Convert skills from string to array if needed
      if (typeof query.skills === 'string') {
        query.skills = [query.skills];
      }

      const result = await this.technicianRepository.findAll(query);

      res.json({
        technicians: result.technicians,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error('Error fetching technicians:', error);
      res.status(500).json({ error: 'Failed to fetch technicians' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateTechnicianData = req.body;

      const updated = await this.technicianRepository.update(id, updateData);

      if (!updated) {
        res.status(404).json({ error: 'Technician not found' });
        return;
      }

      await this.redisClient.delete(`technician:${id}`);

      res.json({
        message: 'Technician updated successfully',
        technician: updated,
      });
    } catch (error) {
      console.error('Error updating technician:', error);
      res.status(500).json({ error: 'Failed to update technician' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const deleted = await this.technicianRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Technician not found' });
        return;
      }

      await this.redisClient.delete(`technician:${id}`);

      res.json({ message: 'Technician deleted successfully' });
    } catch (error) {
      console.error('Error deleting technician:', error);
      res.status(500).json({ error: 'Failed to delete technician' });
    }
  };

  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const stats = await this.technicianRepository.getStatistics(id);

      if (!stats) {
        res.status(404).json({ error: 'Technician not found' });
        return;
      }

      res.json({ statistics: stats });
    } catch (error) {
      console.error('Error fetching technician statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  };

  createSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const scheduleData: CreateScheduleData = req.body;
      const schedule = await this.technicianRepository.createSchedule(scheduleData);

      res.status(201).json({
        message: 'Schedule created successfully',
        schedule,
      });
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  };

  getSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const schedules = await this.technicianRepository.findSchedulesByTechnicianId(id, start, end);

      res.json({ schedules });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  };

  updateSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { scheduleId } = req.params;
      const updateData: UpdateScheduleData = req.body;

      const updated = await this.technicianRepository.updateSchedule(scheduleId, updateData);

      if (!updated) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      res.json({
        message: 'Schedule updated successfully',
        schedule: updated,
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  };

  deleteSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { scheduleId } = req.params;

      const deleted = await this.technicianRepository.deleteSchedule(scheduleId);

      if (!deleted) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  };
}

export default TechnicianController;
