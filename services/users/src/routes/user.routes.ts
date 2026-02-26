import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { validate, validateQuery } from '../middleware/validation.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  createUserSchema,
  updateUserSchema,
  userListQuerySchema,
  updateStatusSchema,
} from '../validators/user.validator';

const router = Router();
const userController = new UserController();

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Public
 */
router.post('/', validate(createUserSchema), userController.create);

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Public
 */
router.get('/', validateQuery(userListQuerySchema), userController.getAll);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', userController.getById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Public
 */
router.put('/:id', validate(updateUserSchema), userController.update);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Public
 */
router.delete('/:id', userController.delete);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status
 * @access  Public
 */
router.patch('/:id/status', validate(updateStatusSchema), userController.updateStatus);

/**
 * @route   POST /api/users/:id/photo
 * @desc    Upload profile photo
 * @access  Public
 */
router.post('/:id/photo', upload.single('photo'), userController.uploadPhoto);

export default router;
