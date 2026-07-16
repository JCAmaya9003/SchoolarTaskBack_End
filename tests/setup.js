import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import * as userService from '../src/services/user-service.js';

let mongoServer;

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// POST /api/users/register (público) solo permite auto-registro como student/parent.
// Para sembrar un usuario admin/teacher en tests, se llama al service directamente
// (mismo hasheo de password y lookup de rol que el endpoint real, sin pasar por esa restricción).
export async function registerUserDirectly(userData) {
  return await userService.registerUser(userData);
}
