import { getDatabase } from './mongodb';

type SettingsDoc = {
  _id: string; // use a fixed id like 'global'
  autoReplyEnabled?: boolean;
  updatedAt: Date;
};

const SETTINGS_COLLECTION = 'appSettings';
const GLOBAL_SETTINGS_ID = 'global';

export async function getGlobalAutoReplyEnabled(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) throw new Error('Database connection failed');
  const coll = db.collection<SettingsDoc>(SETTINGS_COLLECTION);
  const doc = await coll.findOne({ _id: GLOBAL_SETTINGS_ID });
  return !!doc?.autoReplyEnabled;
}

export async function setGlobalAutoReplyEnabled(enabled: boolean): Promise<void> {
  const db = await getDatabase();
  if (!db) throw new Error('Database connection failed');
  const coll = db.collection<SettingsDoc>(SETTINGS_COLLECTION);
  await coll.updateOne(
    { _id: GLOBAL_SETTINGS_ID },
    { $set: { autoReplyEnabled: enabled, updatedAt: new Date() } },
    { upsert: true }
  );
}


