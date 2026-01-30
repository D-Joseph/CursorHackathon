import db from '../database/config';
import { v4 as uuidv4 } from 'uuid';

// Types based on data/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

/**
 * User Service - CRUD operations for users
 */
export class UserService {
  /**
   * Get all users
   */
  getAll(): User[] {
    const users = db.prepare(`
      SELECT * FROM users ORDER BY name ASC
    `).all() as any[];

    return users.map(user => this.buildUser(user));
  }

  /**
   * Get a user by ID
   */
  getById(id: string): User | null {
    const user = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).get(id) as any;

    if (!user) return null;

    return this.buildUser(user);
  }

  /**
   * Get a user by email
   */
  getByEmail(email: string): User | null {
    const user = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(email) as any;

    if (!user) return null;

    return this.buildUser(user);
  }

  /**
   * Create a new user
   */
  create(input: CreateUserInput): User {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, avatarUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, input.name, input.email, input.avatarUrl || null, now, now);

    return this.getById(id)!;
  }

  /**
   * Update a user
   */
  update(id: string, input: UpdateUserInput): User | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.email) {
      updates.push('email = ?');
      values.push(input.email);
    }
    if (input.avatarUrl !== undefined) {
      updates.push('avatarUrl = ?');
      values.push(input.avatarUrl);
    }

    if (updates.length === 0) return this.getById(id);

    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);

    return this.getById(id);
  }

  /**
   * Delete a user
   */
  delete(id: string): boolean {
    const result = db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  /**
   * Check if email already exists
   */
  emailExists(email: string, excludeUserId?: string): boolean {
    let query = `SELECT COUNT(*) as count FROM users WHERE email = ?`;
    const params: any[] = [email];

    if (excludeUserId) {
      query += ` AND id != ?`;
      params.push(excludeUserId);
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count > 0;
  }

  /**
   * Build a complete User object
   */
  private buildUser(user: any): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || undefined,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    };
  }
}

// Export singleton instance
export const userService = new UserService();
