import { Router } from 'express';
import TechnicianController from '../controllers/technician.controller';
import { validate, validateQuery } from '../middleware/validation.middleware';
import {
  createTechnicianSchema,
  updateTechnicianSchema,
  technicianListQuerySchema,
  createScheduleSchema,
  updateScheduleSchema,
} from '../validators/technician.validator';

const router = Router();
const technicianController = new TechnicianController();

// Technician CRUD
router.post('/', validate(createTechnicianSchema), technicianController.create);
router.get('/', validateQuery(technicianListQuerySchema), technicianController.getAll);
router.get('/:id', technicianController.getById);
router.put('/:id', validate(updateTechnicianSchema), technicianController.update);
router.delete('/:id', technicianController.delete);

// Technician statistics
router.get('/:id/statistics', technicianController.getStatistics);

// Technician schedules
router.post('/schedules', validate(createScheduleSchema), technicianController.createSchedule);
router.get('/:id/schedules', technicianController.getSchedules);
router.put('/schedules/:scheduleId', validate(updateScheduleSchema), technicianController.updateSchedule);
router.delete('/schedules/:scheduleId', technicianController.deleteSchedule);

export default router;
