import db from '../database/config';
import { v4 as uuidv4 } from 'uuid';

// Types based on data/types.ts
export interface Friend {
  id: string;
  userId: string;
  name: string;
  birthday: Date;
  relationship: 'family' | 'partner' | 'friend' | 'colleague' | 'mentor' | 'other';
  profileImageUrl?: string;
  likes: PreferenceCategory[];
  dislikes: PreferenceCategory[];
  notes: FriendNote[];
  importantDates: ImportantDate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PreferenceCategory {
  id: string;
  friendId: string;
  name: string;
  items: RankedItem[];
  categoryType: 'like' | 'dislike';
}

export interface RankedItem {
  id: string;
  categoryId: string;
  name: string;
  tags: string[];
  rank: number;
  description?: string;
  source?: string;
}

export interface FriendNote {
  id: string;
  friendId: string;
  content: string;
  category: 'general' | 'hobbies' | 'style' | 'lifestyle' | 'wishlist' | 'conversations' | 'other';
  createdAt: Date;
}

export interface ImportantDate {
  id: string;
  friendId: string;
  name: string;
  date: Date;
  type: 'birthday' | 'anniversary' | 'holiday' | 'graduation' | 'wedding' | 'christmas' | 'other' | 'custom';
  recurring: boolean;
  giftIdeas?: string[];
}

export interface CreateFriendInput {
  userId?: string;
  name: string;
  birthday: string;
  relationship: Friend['relationship'];
  profileImageUrl?: string;
  likes?: Array<{ name: string; categoryType: 'like'; items: Array<{ name: string; tags: string[]; rank: number }> }>;
  dislikes?: Array<{ name: string; categoryType: 'dislike'; items: Array<{ name: string; tags: string[]; rank: number }> }>;
}

export interface UpdateFriendInput {
  name?: string;
  birthday?: string;
  relationship?: Friend['relationship'];
  profileImageUrl?: string;
  likes?: Array<{ name: string; categoryType: 'like'; items: Array<{ name: string; tags: string[]; rank: number }> }>;
  dislikes?: Array<{ name: string; categoryType: 'dislike'; items: Array<{ name: string; tags: string[]; rank: number }> }>;
  holidays?: Array<{ name: string; date: string; type: 'other'; recurring: boolean; giftIdeas: string[] }>;
}

/**
 * Friend Service - CRUD operations for friends and their nested data
 */
export class FriendService {
  /**
   * Get or create a default user for single-user mode
   */
  private getOrCreateDefaultUser(): string {
    // Try to find existing default user by email first
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@example.com') as { id: string } | undefined;

    if (existingUser) {
      return existingUser.id;
    }

    // Try by the "default-user" id pattern (for backwards compatibility)
    const legacyUser = db.prepare('SELECT id FROM users WHERE id = ?').get('default-user') as { id: string } | undefined;

    if (legacyUser) {
      return legacyUser.id;
    }

    // Create default user
    const userId = 'default-user';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, avatarUrl)
      VALUES (?, ?, ?, ?)
    `).run(userId, 'Demo User', 'demo@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo');

    return userId;
  }

  /**
   * Get all friends for a user
   */
  getAllByUserId(userId: string): Friend[] {
    const friends = db.prepare(`
      SELECT * FROM friends WHERE userId = ? ORDER BY name ASC
    `).all(userId) as any[];

    return friends.map(friend => this.buildFriendWithNestedData(friend));
  }

  /**
   * Get a single friend by ID
   */
  getById(id: string): Friend | null {
    const friend = db.prepare(`
      SELECT * FROM friends WHERE id = ?
    `).get(id) as any;

    if (!friend) return null;

    return this.buildFriendWithNestedData(friend);
  }

  /**
   * Create a new friend
   */
  create(input: CreateFriendInput): Friend {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Use provided userId or get/create default user
    // If userId is "default-user" or doesn't exist, create/use the default user
    let userId = input.userId;
    if (!userId || userId === 'default-user') {
      userId = this.getOrCreateDefaultUser();
    } else {
      // Verify the user exists, if not use default
      const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!userExists) {
        userId = this.getOrCreateDefaultUser();
      }
    }

    db.prepare(`
      INSERT INTO friends (id, userId, name, birthday, relationship, profileImageUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, input.name, input.birthday, input.relationship, input.profileImageUrl || null, now, now);

    // Create preference categories and ranked items for likes
    if (input.likes && input.likes.length > 0) {
      for (const category of input.likes) {
        const categoryId = uuidv4();
        db.prepare(`
          INSERT INTO preference_categories (id, friendId, name, categoryType)
          VALUES (?, ?, ?, ?)
        `).run(categoryId, id, category.name, 'like');

        if (category.items) {
          for (const item of category.items) {
            db.prepare(`
              INSERT INTO ranked_items (id, categoryId, name, tags, rank, description, source)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(uuidv4(), categoryId, item.name, JSON.stringify(item.tags), item.rank, null, null);
          }
        }
      }
    }

    // Create preference categories and ranked items for dislikes
    if (input.dislikes && input.dislikes.length > 0) {
      for (const category of input.dislikes) {
        const categoryId = uuidv4();
        db.prepare(`
          INSERT INTO preference_categories (id, friendId, name, categoryType)
          VALUES (?, ?, ?, ?)
        `).run(categoryId, id, category.name, 'dislike');

        if (category.items) {
          for (const item of category.items) {
            db.prepare(`
              INSERT INTO ranked_items (id, categoryId, name, tags, rank, description, source)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(uuidv4(), categoryId, item.name, JSON.stringify(item.tags), item.rank, null, null);
          }
        }
      }
    }

    return this.getById(id)!;
  }

  /**
   * Update a friend
   */
  update(id: string, input: UpdateFriendInput): Friend | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.birthday) {
      updates.push('birthday = ?');
      values.push(input.birthday);
    }
    if (input.relationship) {
      updates.push('relationship = ?');
      values.push(input.relationship);
    }
    if (input.profileImageUrl !== undefined) {
      updates.push('profileImageUrl = ?');
      values.push(input.profileImageUrl);
    }

    // Handle likes update - delete existing and create new
    if (input.likes !== undefined) {
      // Delete existing like categories
      const existingLikes = db.prepare(`
        SELECT id FROM preference_categories WHERE friendId = ? AND categoryType = 'like'
      `).all(id) as any[];
      for (const category of existingLikes) {
        db.prepare(`DELETE FROM ranked_items WHERE categoryId = ?`).run(category.id);
        db.prepare(`DELETE FROM preference_categories WHERE id = ?`).run(category.id);
      }
      // Create new like categories
      for (const category of input.likes) {
        const categoryId = uuidv4();
        db.prepare(`
          INSERT INTO preference_categories (id, friendId, name, categoryType)
          VALUES (?, ?, ?, ?)
        `).run(categoryId, id, category.name, 'like');
        if (category.items) {
          for (const item of category.items) {
            db.prepare(`
              INSERT INTO ranked_items (id, categoryId, name, tags, rank, description, source)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(uuidv4(), categoryId, item.name, JSON.stringify(item.tags), item.rank, null, null);
          }
        }
      }
    }

    // Handle dislikes update - delete existing and create new
    if (input.dislikes !== undefined) {
      // Delete existing dislike categories
      const existingDislikes = db.prepare(`
        SELECT id FROM preference_categories WHERE friendId = ? AND categoryType = 'dislike'
      `).all(id) as any[];
      for (const category of existingDislikes) {
        db.prepare(`DELETE FROM ranked_items WHERE categoryId = ?`).run(category.id);
        db.prepare(`DELETE FROM preference_categories WHERE id = ?`).run(category.id);
      }
      // Create new dislike categories
      for (const category of input.dislikes) {
        const categoryId = uuidv4();
        db.prepare(`
          INSERT INTO preference_categories (id, friendId, name, categoryType)
          VALUES (?, ?, ?, ?)
        `).run(categoryId, id, category.name, 'dislike');
        if (category.items) {
          for (const item of category.items) {
            db.prepare(`
              INSERT INTO ranked_items (id, categoryId, name, tags, rank, description, source)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(uuidv4(), categoryId, item.name, JSON.stringify(item.tags), item.rank, null, null);
          }
        }
      }
    }

    // Handle holidays update - delete existing non-birthday important dates and create new
    if (input.holidays !== undefined) {
      // Delete existing holiday dates (type !== 'birthday')
      const existingDates = db.prepare(`
        SELECT id FROM important_dates WHERE friendId = ? AND type != 'birthday'
      `).all(id) as any[];
      for (const date of existingDates) {
        db.prepare(`DELETE FROM important_dates WHERE id = ?`).run(date.id);
      }
      // Create new holiday dates
      for (const date of input.holidays) {
        db.prepare(`
          INSERT INTO important_dates (id, friendId, name, date, type, recurring, giftIdeas)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), id, date.name, date.date, date.type, date.recurring ? 1 : 0, JSON.stringify(date.giftIdeas || []));
      }
    }

    if (updates.length === 0) return this.getById(id);

    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`
      UPDATE friends SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);

    return this.getById(id);
  }

  /**
   * Delete a friend (cascade deletes related data)
   */
  delete(id: string): boolean {
    const result = db.prepare(`DELETE FROM friends WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  /**
   * Add a preference category to a friend
   */
  addPreferenceCategory(
    friendId: string,
    name: string,
    categoryType: 'like' | 'dislike'
  ): PreferenceCategory {
    const id = uuidv4();

    db.prepare(`
      INSERT INTO preference_categories (id, friendId, name, categoryType)
      VALUES (?, ?, ?, ?)
    `).run(id, friendId, name, categoryType);

    return {
      id,
      friendId,
      name,
      items: [],
      categoryType
    };
  }

  /**
   * Add a ranked item to a preference category
   */
  addRankedItem(
    categoryId: string,
    name: string,
    tags: string[],
    rank: number,
    description?: string,
    source?: string
  ): RankedItem {
    const id = uuidv4();

    db.prepare(`
      INSERT INTO ranked_items (id, categoryId, name, tags, rank, description, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, categoryId, name, JSON.stringify(tags), rank, description || null, source || null);

    return {
      id,
      categoryId,
      name,
      tags,
      rank,
      description,
      source
    };
  }

  /**
   * Add a note to a friend
   */
  addNote(friendId: string, content: string, category: FriendNote['category']): FriendNote {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO friend_notes (id, friendId, content, category, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, friendId, content, category, now);

    return {
      id,
      friendId,
      content,
      category,
      createdAt: new Date(now)
    };
  }

  /**
   * Add an important date to a friend
   */
  addImportantDate(
    friendId: string,
    name: string,
    date: string,
    type: ImportantDate['type'],
    recurring: boolean,
    giftIdeas?: string[]
  ): ImportantDate {
    const id = uuidv4();

    db.prepare(`
      INSERT INTO important_dates (id, friendId, name, date, type, recurring, giftIdeas)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, friendId, name, date, type, recurring ? 1 : 0, JSON.stringify(giftIdeas || []));

    return {
      id,
      friendId,
      name,
      date: new Date(date),
      type,
      recurring,
      giftIdeas
    };
  }

  /**
   * Delete a note from a friend
   */
  deleteNote(noteId: string): boolean {
    const result = db.prepare(`DELETE FROM friend_notes WHERE id = ?`).run(noteId);
    return result.changes > 0;
  }

  /**
   * Delete an important date from a friend
   */
  deleteImportantDate(dateId: string): boolean {
    const result = db.prepare(`DELETE FROM important_dates WHERE id = ?`).run(dateId);
    return result.changes > 0;
  }

  /**
   * Build a complete Friend object with all nested data
   */
  private buildFriendWithNestedData(friend: any): Friend {
    // Get preference categories
    const categories = db.prepare(`
      SELECT * FROM preference_categories WHERE friendId = ?
    `).all(friend.id) as any[];

    const likes: PreferenceCategory[] = [];
    const dislikes: PreferenceCategory[] = [];

    for (const category of categories) {
      // Get ranked items for this category
      const items = db.prepare(`
        SELECT * FROM ranked_items WHERE categoryId = ?
      `).all(category.id) as any[];

      const rankedItems: RankedItem[] = items.map(item => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        tags: JSON.parse(item.tags || '[]'),
        rank: item.rank,
        description: item.description || undefined,
        source: item.source || undefined
      }));

      const prefCategory: PreferenceCategory = {
        id: category.id,
        friendId: category.friendId,
        name: category.name,
        items: rankedItems,
        categoryType: category.categoryType as 'like' | 'dislike'
      };

      if (category.categoryType === 'like') {
        likes.push(prefCategory);
      } else {
        dislikes.push(prefCategory);
      }
    }

    // Get notes
    const notes = db.prepare(`
      SELECT * FROM friend_notes WHERE friendId = ? ORDER BY createdAt DESC
    `).all(friend.id) as any[];

    const friendNotes: FriendNote[] = notes.map(note => ({
      id: note.id,
      friendId: note.friendId,
      content: note.content,
      category: note.category as FriendNote['category'],
      createdAt: new Date(note.createdAt)
    }));

    // Get important dates
    const importantDatesRaw = db.prepare(`
      SELECT * FROM important_dates WHERE friendId = ? ORDER BY date ASC
    `).all(friend.id) as any[];

    const importantDates: ImportantDate[] = importantDatesRaw.map(date => ({
      id: date.id,
      friendId: date.friendId,
      name: date.name,
      date: new Date(date.date),
      type: date.type as ImportantDate['type'],
      recurring: Boolean(date.recurring),
      giftIdeas: JSON.parse(date.giftIdeas || '[]')
    }));

    return {
      id: friend.id,
      userId: friend.userId,
      name: friend.name,
      birthday: new Date(friend.birthday),
      relationship: friend.relationship as Friend['relationship'],
      profileImageUrl: friend.profileImageUrl || undefined,
      likes,
      dislikes,
      notes: friendNotes,
      importantDates,
      createdAt: new Date(friend.createdAt),
      updatedAt: new Date(friend.updatedAt)
    };
  }
}

// Export singleton instance
export const friendService = new FriendService();
