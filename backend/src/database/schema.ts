import db from './config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize database schema
 * Creates all tables for the gift-giving platform
 */
export function initializeDatabase(): void {
  console.log('Initializing database schema...');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatarUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create friends table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      birthday DATE NOT NULL,
      relationship TEXT NOT NULL CHECK(relationship IN ('family', 'partner', 'friend', 'colleague', 'mentor', 'other')),
      profileImageUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create preference_categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS preference_categories (
      id TEXT PRIMARY KEY,
      friendId TEXT NOT NULL,
      name TEXT NOT NULL,
      categoryType TEXT NOT NULL CHECK(categoryType IN ('like', 'dislike')),
      FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
    )
  `);

  // Create ranked_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ranked_items (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL,
      name TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      rank INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      source TEXT,
      FOREIGN KEY (categoryId) REFERENCES preference_categories(id) ON DELETE CASCADE
    )
  `);

  // Create friend_notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_notes (
      id TEXT PRIMARY KEY,
      friendId TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('general', 'hobbies', 'style', 'lifestyle', 'wishlist', 'conversations', 'other')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
    )
  `);

  // Create important_dates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS important_dates (
      id TEXT PRIMARY KEY,
      friendId TEXT NOT NULL,
      name TEXT NOT NULL,
      date DATE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('birthday', 'anniversary', 'holiday', 'graduation', 'wedding', 'christmas', 'other', 'custom')),
      recurring INTEGER DEFAULT 0,
      giftIdeas TEXT DEFAULT '[]',
      FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
    )
  `);

  // Create gift_search_results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gift_search_results (
      id TEXT PRIMARY KEY,
      searchId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      sourceUrl TEXT NOT NULL,
      sourceName TEXT NOT NULL,
      priceAmount REAL NOT NULL DEFAULT 0,
      priceCurrency TEXT DEFAULT 'USD',
      isOnSale INTEGER DEFAULT 0,
      originalAmount REAL,
      discountPercentage REAL,
      imageUrl TEXT,
      relevanceScore REAL DEFAULT 0,
      matchReasons TEXT DEFAULT '[]',
      categories TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      inStock INTEGER DEFAULT 1,
      shippingTime TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create saved_gifts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_gifts (
      id TEXT PRIMARY KEY,
      searchResultId TEXT,
      friendId TEXT NOT NULL,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      priceAmount REAL DEFAULT 0,
      priceCurrency TEXT DEFAULT 'USD',
      purchaseUrl TEXT NOT NULL,
      imageUrl TEXT,
      givenAt DATETIME,
      occasion TEXT,
      notes TEXT,
      status TEXT DEFAULT 'idea' CHECK(status IN ('idea', 'purchased', 'wrapped', 'given', 'returned', 'archived')),
      userRating INTEGER,
      recipientReaction TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (searchResultId) REFERENCES gift_search_results(id),
      FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create gift_timelines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gift_timelines (
      id TEXT PRIMARY KEY,
      friendId TEXT NOT NULL,
      eventType TEXT NOT NULL CHECK(eventType IN ('gift_given', 'gift_saved', 'gift_idea', 'occasion_celebrated', 'search_performed')),
      date DATETIME NOT NULL,
      giftId TEXT,
      occasion TEXT,
      notes TEXT,
      photos TEXT DEFAULT '[]',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE,
      FOREIGN KEY (giftId) REFERENCES saved_gifts(id) ON DELETE SET NULL
    )
  `);

  // Create gift_user_feedback table (for gift search results)
  db.exec(`
    CREATE TABLE IF NOT EXISTS gift_user_feedback (
      id TEXT PRIMARY KEY,
      giftId TEXT NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      liked INTEGER DEFAULT 0,
      saved INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (giftId) REFERENCES gift_search_results(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_friends_userId ON friends(userId);
    CREATE INDEX IF NOT EXISTS idx_preference_categories_friendId ON preference_categories(friendId);
    CREATE INDEX IF NOT EXISTS idx_ranked_items_categoryId ON ranked_items(categoryId);
    CREATE INDEX IF NOT EXISTS idx_friend_notes_friendId ON friend_notes(friendId);
    CREATE INDEX IF NOT EXISTS idx_important_dates_friendId ON important_dates(friendId);
    CREATE INDEX IF NOT EXISTS idx_saved_gifts_friendId ON saved_gifts(friendId);
    CREATE INDEX IF NOT EXISTS idx_saved_gifts_userId ON saved_gifts(userId);
    CREATE INDEX IF NOT EXISTS idx_gift_timelines_friendId ON gift_timelines(friendId);
    CREATE INDEX IF NOT EXISTS idx_gift_search_results_searchId ON gift_search_results(searchId);
  `);

  console.log('Database schema initialized successfully!');
}

/**
 * Seed the database with sample data for testing
 */
export function seedDatabase(): void {
  console.log('Seeding database with sample data...');

  // Check if data already exists
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existingUsers.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Create sample user
  const userId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, name, email, avatarUrl)
    VALUES (?, ?, ?, ?)
  `).run(userId, 'Demo User', 'demo@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo');

  // Create sample friends
  const friends = [
    {
      id: uuidv4(),
      userId,
      name: 'Alice Johnson',
      birthday: '1990-05-15',
      relationship: 'friend',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
    },
    {
      id: uuidv4(),
      userId,
      name: 'Bob Smith',
      birthday: '1985-12-03',
      relationship: 'partner',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
    },
    {
      id: uuidv4(),
      userId,
      name: 'Carol Williams',
      birthday: '1978-08-22',
      relationship: 'family',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol'
    }
  ];

  const insertFriend = db.prepare(`
    INSERT INTO friends (id, userId, name, birthday, relationship, profileImageUrl)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const friend of friends) {
    insertFriend.run(friend.id, friend.userId, friend.name, friend.birthday, friend.relationship, friend.profileImageUrl);

    // Add preference categories
    const techCategoryId = uuidv4();
    db.prepare(`
      INSERT INTO preference_categories (id, friendId, name, categoryType)
      VALUES (?, ?, ?, ?)
    `).run(techCategoryId, friend.id, 'Tech & Gadgets', 'like');

    // Add ranked items
    db.prepare(`
      INSERT INTO ranked_items (id, categoryId, name, tags, rank, description, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      techCategoryId,
      'Smart Home Devices',
      JSON.stringify(['smart home', 'technology', 'automation']),
      5,
      'Anything related to smart home automation and IoT devices',
      'Past conversations'
    );

    db.prepare(`
      INSERT INTO ranked_items (id, categoryId, name, tags, rank, description, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      techCategoryId,
      'Wireless Earbuds',
      JSON.stringify(['audio', 'music', 'portable']),
      4,
      'High-quality wireless earbuds or headphones',
      'Wishlist mention'
    );

    // Add important dates
    db.prepare(`
      INSERT INTO important_dates (id, friendId, name, date, type, recurring, giftIdeas)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      friend.id,
      'Birthday',
      friend.birthday,
      'birthday',
      1,
      JSON.stringify(['Tech gadgets', 'Books', 'Experience gifts'])
    );

    // Add notes
    db.prepare(`
      INSERT INTO friend_notes (id, friendId, content, category)
      VALUES (?, ?, ?, ?)
    `).run(
      uuidv4(),
      friend.id,
      `Loves trying out new technology and gadgets.${friend.name.split(' ')[0]} enjoys cooking in their free time.`,
      'hobbies'
    );

    db.prepare(`
      INSERT INTO friend_notes (id, friendId, content, category)
      VALUES (?, ?, ?, ?)
    `).run(
      uuidv4(),
      friend.id,
      'Prefers minimalistic and functional design over flashy items.',
      'style'
    );
  }

  console.log('Database seeded successfully with sample data!');
}

export default { initializeDatabase, seedDatabase };
