import { Platform } from 'react-native';

// Simple in-memory user store for demo purposes
// In production, use a proper database
const users: any[] = [];

export const AUTH_STORAGE_KEY = 'auth_token';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const hashPassword = async (password: string): Promise<string> => {
  // Simple hash for demo - use bcrypt in production
  return Buffer.from(password).toString('base64');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = Buffer.from(password).toString('base64');
  return hashedInput === hash;
};

export const generateToken = (userId: string): string => {
  // Simple token generation for demo
  const payload = { userId, exp: Date.now() + (24 * 60 * 60 * 1000) };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp > Date.now()) {
      return { userId: payload.userId };
    }
    return null;
  } catch {
    return null;
  }
};

export const createUser = async (name: string, email: string, password: string) => {
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const user = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  return user;
};

export const findUser = (email: string) => {
  return users.find(u => u.email === email);
};

export const findUserById = (id: string) => {
  return users.find(u => u.id === id);
};

export const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  // For mobile, you would use AsyncStorage
  return null;
};

export const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  }
  // For mobile, you would use AsyncStorage
};

export const removeStorageItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  }
  // For mobile, you would use AsyncStorage
};
