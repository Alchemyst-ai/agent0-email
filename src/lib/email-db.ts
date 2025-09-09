import { ObjectId, Collection, Document } from 'mongodb';
import { connectToDatabase } from './mongodb';

export interface EmailRecord {
  _id?: ObjectId;
  messageId: string;        // EmailEngine's message ID
  threadId: string;         // Thread identifier
  from: string;             // Sender email
  to: string[];             // Recipient emails
  subject: string;
  content: {
    html: string;
    text: string;
  };
  type: 'sent' | 'auto-reply' | 'manual-reply';
  source: 'compose' | 'webhook' | 'manual-auto-reply';
  timestamp: Date;
  status: 'sent' | 'failed' | 'delivered' | 'opened';
  metadata: {
    aiGenerated: boolean;
    prompt?: string;
    model?: string;
    webhookEvent?: string;
    originalMessageId?: string; // For replies
  };
}

export interface CreateEmailData {
  messageId: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  content: {
    html: string;
    text: string;
  };
  type: EmailRecord['type'];
  source: EmailRecord['source'];
  status?: EmailRecord['status'];
  metadata?: Partial<EmailRecord['metadata']>;
}

export class EmailDatabase {
  private collection: Collection<EmailRecord>;

  constructor(collection: Collection<EmailRecord>) {
    this.collection = collection;
  }

  async createEmail(data: CreateEmailData): Promise<ObjectId> {
    const emailRecord: EmailRecord = {
      ...data,
      timestamp: new Date(),
      status: data.status || 'sent',
      metadata: {
        aiGenerated: false,
        ...data.metadata,
      },
    };

    const result = await this.collection.insertOne(emailRecord);
    console.log(`Email stored in MongoDB with ID: ${result.insertedId}`);
    return result.insertedId;
  }

  async updateEmailStatus(messageId: string, status: EmailRecord['status']): Promise<boolean> {
    const result = await this.collection.updateOne(
      { messageId },
      { $set: { status } }
    );
    return result.modifiedCount > 0;
  }

  async getEmailsByThread(threadId: string): Promise<EmailRecord[]> {
    return await this.collection
      .find({ threadId })
      .sort({ timestamp: -1 })
      .toArray();
  }

  async getSentEmails(limit: number = 50): Promise<EmailRecord[]> {
    return await this.collection
      .find({ type: { $in: ['sent', 'auto-reply', 'manual-reply'] } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async getEmailByMessageId(messageId: string): Promise<EmailRecord | null> {
    return await this.collection.findOne({ messageId });
  }

  async deleteEmail(messageId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ messageId });
    return result.deletedCount > 0;
  }
}

export async function getEmailCollection(): Promise<Collection<EmailRecord>> {
  const db = await connectToDatabase();
  return db.collection<EmailRecord>('emails');
}

export async function getEmailDatabase(): Promise<EmailDatabase> {
  const collection = await getEmailCollection();
  return new EmailDatabase(collection);
}
