import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import * as userService from '../src/services/user-service.js';

let mongoServer;

// Replica-set de un solo nodo en vez de una instancia standalone: las transacciones de MongoDB
// solo funcionan sobre replica-set (o sharded), y varias operaciones multi-entidad las usan.
// En producción (Atlas) la base ya es un replica-set, así que esto acerca el test a la realidad.
export async function setupTestDB() {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function teardownTestDB() {
  // dropDatabase solo si la conexión sigue viva. Si ya se cerró, el mongoServer.stop() de abajo
  // destruye igual toda la instancia en memoria, así que dropear es redundante. Hacerlo sobre una
  // conexión no conectada disparaba "Connection operation buffering timed out" de forma flaky y
  // rompía el CI (el teardown de un archivo caía aunque los 241 tests pasaran).
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
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
