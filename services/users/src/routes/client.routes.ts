import { Router } from 'express';
import ClientController from '../controllers/client.controller';
import { validate, validateQuery } from '../middleware/validation.middleware';
import {
  createClientSchema,
  updateClientSchema,
  clientListQuerySchema,
} from '../validators/client.validator';

const router = Router();
const clientController = new ClientController();

router.post('/', validate(createClientSchema), clientController.create);
router.get('/', validateQuery(clientListQuerySchema), clientController.getAll);
router.get('/:id', clientController.getById);
router.put('/:id', validate(updateClientSchema), clientController.update);
router.delete('/:id', clientController.delete);

export default router;
