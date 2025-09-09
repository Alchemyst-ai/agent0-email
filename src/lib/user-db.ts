import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
}

export interface UpdateUserData {
  name?: string;
  passwordHash?: string;
}

export class UserDatabase {
  private static instance: UserDatabase;
  private collectionName = 'users';

  public static getInstance(): UserDatabase {
    if (!UserDatabase.instance) {
      UserDatabase.instance = new UserDatabase();
    }
    return UserDatabase.instance;
  }

  private async getCollection() {
    const db = await getDatabase();
    if (!db) {
      throw new Error('Database connection failed');
    }
    return db.collection<User>(this.collectionName);
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const user: User = {
      _id: new ObjectId(),
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ email: email.toLowerCase() });
  }

  async updateUser(id: string, updateData: UpdateUserData): Promise<User | null> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    return result;
  }

  async deleteUser(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const collection = await this.getCollection();
    return await collection.find({}).toArray();
  }
}
