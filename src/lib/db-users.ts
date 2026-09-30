import { getDb } from './mongodb';
import bcrypt from 'bcryptjs';

export interface GoogleFitUserTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
  updatedAt: string;
}

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  dob: string; // Date of Birth YYYY-MM-DD
  occupation: string;
  passwordHash?: string;
  provider: 'google' | 'x' | 'instagram' | 'credentials';
  providerAccountId?: string;
  image?: string;
  plan: 'free' | 'pro';
  generationsLimit: number;
  generationsUsed: number;
  googleFitTokens?: GoogleFitUserTokens;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback if MongoDB connection is unavailable during runtime
const memoryUsers = new Map<string, UserProfile>();

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const db = await getDb();

  if (db) {
    try {
      const user = await db.collection<UserProfile>('users').findOne({ email: normalizedEmail });
      if (user) {
        return {
          ...user,
          _id: user._id?.toString(),
        };
      }
    } catch (e) {
      console.warn('Failed to find user in MongoDB, checking fallback:', e);
    }
  }

  return memoryUsers.get(normalizedEmail) || null;
}

export async function createUser(data: {
  name: string;
  email: string;
  dob?: string;
  occupation?: string;
  password?: string;
  provider: 'google' | 'x' | 'instagram' | 'credentials';
  providerAccountId?: string;
  image?: string;
}): Promise<UserProfile> {
  const normalizedEmail = data.email.toLowerCase().trim();
  const now = new Date().toISOString();

  let passwordHash: string | undefined;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  const newUser: UserProfile = {
    name: data.name || 'Anonymous User',
    email: normalizedEmail,
    dob: data.dob || '',
    occupation: data.occupation || '',
    passwordHash,
    provider: data.provider,
    providerAccountId: data.providerAccountId,
    image: data.image,
    plan: 'free',
    generationsLimit: 10, // 10 limit with auth
    generationsUsed: 0,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  if (db) {
    try {
      const docToInsert = { ...newUser };
      delete docToInsert._id;
      const result = await db.collection('users').insertOne(docToInsert as any);
      newUser._id = result.insertedId.toString();
    } catch (e) {
      console.warn('Failed to insert user into MongoDB, saving to memory fallback:', e);
    }
  }

  memoryUsers.set(normalizedEmail, newUser);
  return newUser;
}

export async function updateUserProfile(
  email: string,
  updates: {
    name?: string;
    dob?: string;
    occupation?: string;
    generationsUsed?: number;
    plan?: 'free' | 'pro';
  }
): Promise<UserProfile | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const db = await getDb();
  const now = new Date().toISOString();

  const updateFields: Partial<UserProfile> = {
    ...updates,
    updatedAt: now,
  };

  if (db) {
    try {
      const result = await db.collection('users').findOneAndUpdate(
        { email: normalizedEmail },
        { $set: updateFields },
        { returnDocument: 'after' }
      );
      if (result) {
        const updated = {
          ...(result as any),
          _id: (result as any)._id?.toString(),
        } as UserProfile;
        memoryUsers.set(normalizedEmail, updated);
        return updated;
      }
    } catch (e) {
      console.warn('Failed to update user in MongoDB, updating memory fallback:', e);
    }
  }

  const existing = memoryUsers.get(normalizedEmail);
  if (existing) {
    const updated = { ...existing, ...updateFields };
    memoryUsers.set(normalizedEmail, updated);
    return updated;
  }

  return null;
}

export async function verifyUserPassword(email: string, plainPassword: string): Promise<UserProfile | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) return null;

  const isValid = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!isValid) return null;

  return user;
}

export async function saveUserGoogleFitTokens(
  email: string,
  tokens: { accessToken: string; refreshToken?: string; expiresAt: number; scope?: string }
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const db = await getDb();
  const now = new Date().toISOString();

  const fitTokens: GoogleFitUserTokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    scope: tokens.scope,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.collection('users').updateOne(
        { email: normalizedEmail },
        { $set: { googleFitTokens: fitTokens, updatedAt: now } }
      );
    } catch (e) {
      console.warn('Failed to save Google Fit tokens to MongoDB, updating memory fallback:', e);
    }
  }

  const existing = memoryUsers.get(normalizedEmail);
  if (existing) {
    existing.googleFitTokens = fitTokens;
    existing.updatedAt = now;
    memoryUsers.set(normalizedEmail, existing);
  }
}

export async function getUserGoogleFitTokens(email: string): Promise<GoogleFitUserTokens | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(normalizedEmail);
  return user?.googleFitTokens || null;
}

export async function deleteUserGoogleFitTokens(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const db = await getDb();
  const now = new Date().toISOString();

  if (db) {
    try {
      await db.collection('users').updateOne(
        { email: normalizedEmail },
        { $unset: { googleFitTokens: '' }, $set: { updatedAt: now } }
      );
    } catch (e) {
      console.warn('Failed to delete Google Fit tokens from MongoDB:', e);
    }
  }

  const existing = memoryUsers.get(normalizedEmail);
  if (existing) {
    delete existing.googleFitTokens;
    existing.updatedAt = now;
    memoryUsers.set(normalizedEmail, existing);
  }
}
