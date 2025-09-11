import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

export interface EmailCredentials {
  _id: ObjectId;
  userId: ObjectId;
  emailId: string;
  password: string; // encrypted
  meetingLink?: string;
  provider: string;
  providerIMAPHost?: string;
  providerIMAPPort?: number;
  providerSMTPHost?: string;
  providerSMTPPort?: number;
  providerInboxName?: string;
  providerSentBoxName?: string;
  sendingLimitExceeded?: boolean;
  emailEngineAccountId?: string;
  emailEngineGatewayId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailCredentialsData {
  userId: ObjectId;
  emailId: string;
  password: string; // encrypted
  meetingLink?: string;
  provider: string;
  providerIMAPHost?: string;
  providerIMAPPort?: number;
  providerSMTPHost?: string;
  providerSMTPPort?: number;
  providerInboxName?: string;
  providerSentBoxName?: string;
  emailEngineAccountId?: string;
  emailEngineGatewayId?: string;
}

export interface UpdateEmailCredentialsData {
  password?: string;
  meetingLink?: string;
  providerIMAPHost?: string;
  providerIMAPPort?: number;
  providerSMTPHost?: string;
  providerSMTPPort?: number;
  providerInboxName?: string;
  providerSentBoxName?: string;
  emailEngineAccountId?: string;
  emailEngineGatewayId?: string;
  sendingLimitExceeded?: boolean;
  isActive?: boolean;
}

export class EmailCredentialsDatabase {
  private static instance: EmailCredentialsDatabase;
  private collectionName = 'emailCredentials';

  public static getInstance(): EmailCredentialsDatabase {
    if (!EmailCredentialsDatabase.instance) {
      EmailCredentialsDatabase.instance = new EmailCredentialsDatabase();
    }
    return EmailCredentialsDatabase.instance;
  }

  private async getCollection() {
    const db = await getDatabase();
    if (!db) {
      throw new Error('Database connection failed');
    }
    return db.collection<EmailCredentials>(this.collectionName);
  }

  async createCredentials(credentialsData: CreateEmailCredentialsData): Promise<EmailCredentials> {
    const collection = await this.getCollection();
    const now = new Date();
    
    // Ensure only the very first credentials for a user is active by default
    // Subsequent additions should be inactive until explicitly switched
    const existingCount = await collection.countDocuments({ userId: credentialsData.userId });
    
    const credentials: EmailCredentials = {
      _id: new ObjectId(),
      ...credentialsData,
      sendingLimitExceeded: false,
      isActive: existingCount === 0, // first account becomes active; others default to inactive
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(credentials);
    return credentials;
  }

  async getCredentialsById(id: string): Promise<EmailCredentials | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async getCredentialsByEmail(emailId: string, userId: string): Promise<EmailCredentials | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ 
      emailId: emailId.toLowerCase(), 
      userId: new ObjectId(userId) 
    });
  }

  async getUserCredentials(userId: string): Promise<EmailCredentials[]> {
    const collection = await this.getCollection();
    return await collection.find({ userId: new ObjectId(userId) }).toArray();
  }

  async updateCredentials(id: string, updateData: UpdateEmailCredentialsData): Promise<EmailCredentials | null> {
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

  async deleteCredentials(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  async setActiveCredentials(userId: string, credentialsId: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    // First, set all credentials for this user to inactive
    await collection.updateMany(
      { userId: new ObjectId(userId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
    
    // Then set the selected credentials to active
    const result = await collection.updateOne(
      { _id: new ObjectId(credentialsId), userId: new ObjectId(userId) },
      { $set: { isActive: true, updatedAt: new Date() } }
    );
    
    return result.modifiedCount > 0;
  }

  async getActiveCredentials(userId: string): Promise<EmailCredentials | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ 
      userId: new ObjectId(userId), 
      isActive: true 
    });
  }

  async getUserIdByEmail(emailId: string): Promise<ObjectId | null> {
    const collection = await this.getCollection();
    const credentials = await collection.findOne({ 
      emailId: emailId.toLowerCase()
    });
    return credentials?.userId || null;
  }
}
