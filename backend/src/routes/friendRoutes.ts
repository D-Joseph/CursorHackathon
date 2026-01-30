import { Router, Request, Response } from 'express';
import { friendService, CreateFriendInput, UpdateFriendInput } from '../services/friendService';

const router = Router();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * GET /api/friends
 * Get all friends for the default user
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const userId = 'default-user';

    const friends = friendService.getAllByUserId(userId);

    res.json({
      success: true,
      data: friends,
      message: `Found ${friends.length} friends`
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve friends'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/friends/:id
 * Get a single friend by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const friend = friendService.getById(id);

    if (!friend) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: friend
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting friend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve friend'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/friends
 * Create a new friend for the default user
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, birthday, relationship, profileImageUrl, likes, dislikes } = req.body;

    if (!name || !birthday || !relationship) {
      return res.status(400).json({
        success: false,
        error: 'name, birthday, and relationship are required'
      } as ApiResponse<null>);
    }

    const validRelationships = ['family', 'partner', 'friend', 'colleague', 'mentor', 'other'];
    if (!validRelationships.includes(relationship)) {
      return res.status(400).json({
        success: false,
        error: `relationship must be one of: ${validRelationships.join(', ')}`
      } as ApiResponse<null>);
    }

    const input: CreateFriendInput = {
      name,
      birthday,
      relationship,
      profileImageUrl,
      likes: likes || [],
      dislikes: dislikes || [],
    };

    const friend = friendService.create(input);

    res.status(201).json({
      success: true,
      data: friend,
      message: 'Friend created successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error creating friend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create friend'
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/friends/:id
 * Update a friend
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, birthday, relationship, profileImageUrl, likes, dislikes, holidays } = req.body;

    const input: UpdateFriendInput = {};
    if (name) input.name = name;
    if (birthday) input.birthday = birthday;
    if (relationship) input.relationship = relationship;
    if (profileImageUrl !== undefined) input.profileImageUrl = profileImageUrl;
    if (likes !== undefined) input.likes = likes;
    if (dislikes !== undefined) input.dislikes = dislikes;
    if (holidays !== undefined) input.holidays = holidays;

    const friend = friendService.update(id, input);

    if (!friend) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: friend,
      message: 'Friend updated successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error updating friend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update friend'
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /api/friends/:id
 * Delete a friend
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = friendService.delete(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: 'Friend deleted successfully'
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Error deleting friend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete friend'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/friends/:id/preferences
 * Add a preference category to a friend
 */
router.post('/:id/preferences', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, categoryType } = req.body;

    if (!name || !categoryType) {
      return res.status(400).json({
        success: false,
        error: 'name and categoryType are required'
      } as ApiResponse<null>);
    }

    if (!['like', 'dislike'].includes(categoryType)) {
      return res.status(400).json({
        success: false,
        error: 'categoryType must be "like" or "dislike"'
      } as ApiResponse<null>);
    }

    const friend = friendService.getById(id);
    if (!friend) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found'
      } as ApiResponse<null>);
    }

    const category = friendService.addPreferenceCategory(id, name, categoryType);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Preference category added successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error adding preference:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add preference category'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/friends/:id/notes
 * Add a note to a friend
 */
router.post('/:id/notes', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, category } = req.body;

    if (!content || !category) {
      return res.status(400).json({
        success: false,
        error: 'content and category are required'
      } as ApiResponse<null>);
    }

    const validCategories = ['general', 'hobbies', 'style', 'lifestyle', 'wishlist', 'conversations', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `category must be one of: ${validCategories.join(', ')}`
      } as ApiResponse<null>);
    }

    const friend = friendService.getById(id);
    if (!friend) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found'
      } as ApiResponse<null>);
    }

    const note = friendService.addNote(id, content, category);

    res.status(201).json({
      success: true,
      data: note,
      message: 'Note added successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/friends/:id/dates
 * Add an important date to a friend
 */
router.post('/:id/dates', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, date, type, recurring, giftIdeas } = req.body;

    if (!name || !date || !type) {
      return res.status(400).json({
        success: false,
        error: 'name, date, and type are required'
      } as ApiResponse<null>);
    }

    const validTypes = ['birthday', 'anniversary', 'holiday', 'graduation', 'wedding', 'christmas', 'other', 'custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `type must be one of: ${validTypes.join(', ')}`
      } as ApiResponse<null>);
    }

    const friend = friendService.getById(id);
    if (!friend) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found'
      } as ApiResponse<null>);
    }

    const importantDate = friendService.addImportantDate(id, name, date, type, recurring || false, giftIdeas);

    res.status(201).json({
      success: true,
      data: importantDate,
      message: 'Important date added successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error adding important date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add important date'
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /api/friends/:friendId/notes/:noteId
 * Delete a note from a friend
 */
router.delete('/:friendId/notes/:noteId', (req: Request, res: Response) => {
  try {
    const { friendId, noteId } = req.params;

    const friend = friendService.getById(friendId);
    if (!friend) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found'
      } as ApiResponse<null>);
    }

    const success = friendService.deleteNote(noteId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /api/friends/:friendId/dates/:dateId
 * Delete an important date from a friend
 */
router.delete('/:friendId/dates/:dateId', (req: Request, res: Response) => {
  try {
    const { friendId, dateId } = req.params;

    const friend = friendService.getById(friendId);
    if (!friend) {
      return res.status(404).json({
        success: false,
        error: 'Friend not found'
      } as ApiResponse<null>);
    }

    const success = friendService.deleteImportantDate(dateId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Important date not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: 'Important date deleted successfully'
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Error deleting important date:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete important date'
    } as ApiResponse<null>);
  }
});

export default router;
