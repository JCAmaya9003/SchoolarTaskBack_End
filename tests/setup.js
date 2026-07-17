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

// El registro público solo permite auto-registro como student o parent. Para sembrar un
// admin o teacher en tests, se llama al service directo, sin pasar por esa restricción.
export async function registerUserDirectly(userData) {
  return await userService.registerUser(userData);
}
