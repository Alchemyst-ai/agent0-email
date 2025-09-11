import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

export interface AutoReplyWhitelist {
  _id: ObjectId;
  userId: ObjectId;
  emailAddress: string;
  createdAt: Date;
}

export interface CreateWhitelistData {
  userId: ObjectId;
  emailAddress: string;
}

export class AutoReplyWhitelistDatabase {
  private static instance: AutoReplyWhitelistDatabase;
  private collectionName = 'autoReplyWhitelist';

  public static getInstance(): AutoReplyWhitelistDatabase {
    if (!AutoReplyWhitelistDatabase.instance) {
      AutoReplyWhitelistDatabase.instance = new AutoReplyWhitelistDatabase();
    }
    return AutoReplyWhitelistDatabase.instance;
  }

  private async getCollection() {
    const db = await getDatabase();
    if (!db) {
      throw new Error('Database connection failed');
    }
    return db.collection<AutoReplyWhitelist>(this.collectionName);
  }

  async addToWhitelist(data: CreateWhitelistData): Promise<AutoReplyWhitelist> {
    const collection = await this.getCollection();
    
    // Check if email already exists for this user
    const existing = await collection.findOne({
      userId: data.userId,
      emailAddress: data.emailAddress.toLowerCase()
    });

    if (existing) {
      throw new Error('Email address already in whitelist');
    }

    const whitelistEntry: AutoReplyWhitelist = {
      _id: new ObjectId(),
      userId: data.userId,
      emailAddress: data.emailAddress.toLowerCase(),
      createdAt: new Date(),
    };

    await collection.insertOne(whitelistEntry);
    return whitelistEntry;
  }

  async removeFromWhitelist(userId: ObjectId, emailAddress: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({
      userId,
      emailAddress: emailAddress.toLowerCase()
    });
    return result.deletedCount > 0;
  }

  async getWhitelist(userId: ObjectId): Promise<AutoReplyWhitelist[]> {
    const collection = await this.getCollection();
    return await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  }

  async isEmailWhitelisted(userId: ObjectId, emailAddress: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.findOne({
      userId,
      emailAddress: emailAddress.toLowerCase()
    });
    return !!result;
  }

  async clearWhitelist(userId: ObjectId): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany({ userId });
    return result.deletedCount;
  }
}
