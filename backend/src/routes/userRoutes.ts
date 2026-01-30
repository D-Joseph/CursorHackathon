import { Router, Request, Response } from 'express';
import { userService, CreateUserInput, UpdateUserInput } from '../services/userService';

const router = Router();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * GET /api/users
 * Get all users
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const users = userService.getAll();

    res.json({
      success: true,
      data: users,
      message: `Found ${users.length} users`
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = userService.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: user
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/users/email/:email
 * Get a user by email
 */
router.get('/email/:email', (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = userService.getByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: user
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting user by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, avatarUrl } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'name and email are required'
      } as ApiResponse<null>);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      } as ApiResponse<null>);
    }

    // Check if email already exists
    if (userService.emailExists(email)) {
      return res.status(409).json({
        success: false,
        error: 'A user with this email already exists'
      } as ApiResponse<null>);
    }

    const input: CreateUserInput = {
      name,
      email,
      avatarUrl
    };

    const user = userService.create(input);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, avatarUrl } = req.body;

    // Check if user exists
    const existingUser = userService.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<null>);
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        } as ApiResponse<null>);
      }

      // Check if email is already used by another user
      if (userService.emailExists(email, id)) {
        return res.status(409).json({
          success: false,
          error: 'A user with this email already exists'
        } as ApiResponse<null>);
      }
    }

    const input: UpdateUserInput = {};
    if (name) input.name = name;
    if (email) input.email = email;
    if (avatarUrl !== undefined) input.avatarUrl = avatarUrl;

    const user = userService.update(id, input);

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingUser = userService.getById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<null>);
    }

    const success = userService.delete(id);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    } as ApiResponse<null>);
  }
});

export default router;
