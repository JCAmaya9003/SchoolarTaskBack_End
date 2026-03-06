import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js';
import * as userService from '../../src/services/user-service.js';
import Role from '../../src/models/role-model.js';

// Datos de prueba
const testUserData = {
  nombre: 'Juan',
  apellido: 'Perez',
  email: 'juan@test.com',
  password: 'password123',
  fecha_nacimiento: '2000-01-01',
  rolNombre: 'student',
  genero: 'Masculino',
  domicilio: 'Calle 123',
  nacionalidad: 'Venezolana',
};

beforeAll(async () => {
  await setupTestDB();
  // Crear rol necesario para los tests
  await Role.create({ nombre: 'student' });
  await Role.create({ nombre: 'admin' });
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  // Limpiar solo usuarios, no roles
  const mongoose = (await import('mongoose')).default;
  await mongoose.connection.collection('users').deleteMany({});
});

describe('registerUser', () => {
  it('debe registrar un usuario nuevo correctamente', async () => {
    const user = await userService.registerUser(testUserData);

    expect(user).toBeDefined();
    expect(user.nombre).toBe('Juan');
    expect(user.apellido).toBe('Perez');
    expect(user.email).toBe('juan@test.com');
    expect(user.password).not.toBe('password123'); // Debe estar hasheado
  });

  it('debe lanzar error si el usuario ya existe', async () => {
    await userService.registerUser(testUserData);

    await expect(userService.registerUser(testUserData))
      .rejects.toThrow('Usuario ya existe');
  });

  it('debe lanzar error si el rol no existe', async () => {
    const badData = { ...testUserData, email: 'otro@test.com', rolNombre: 'rolInexistente' };

    await expect(userService.registerUser(badData))
      .rejects.toThrow('El rol no existe');
  });
});

describe('loginUser', () => {
  beforeEach(async () => {
    await userService.registerUser(testUserData);
  });

  it('debe hacer login correctamente con credenciales válidas', async () => {
    const user = await userService.loginUser({
      email: 'juan@test.com',
      password: 'password123',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('juan@test.com');
  });

  it('debe lanzar error con contraseña incorrecta', async () => {
    await expect(userService.loginUser({
      email: 'juan@test.com',
      password: 'wrongpassword',
    })).rejects.toThrow('Contraseña inválida');
  });

  it('debe lanzar error con email inexistente', async () => {
    await expect(userService.loginUser({
      email: 'noexiste@test.com',
      password: 'password123',
    })).rejects.toThrow('Usuario inexistente');
  });
});

describe('eraseUser (soft delete)', () => {
  it('debe hacer soft delete del usuario', async () => {
    await userService.registerUser(testUserData);

    const erased = await userService.eraseUser('juan@test.com');
    expect(erased).toBeDefined();

    // El usuario no debe ser encontrado con búsqueda normal
    const notFound = await userService.searchUserByEmail('juan@test.com');
    expect(notFound).toBeNull();
  });

  it('debe lanzar error si el usuario no existe', async () => {
    await expect(userService.eraseUser('noexiste@test.com'))
      .rejects.toThrow('Usuario no existe');
  });
});

describe('restoreUser', () => {
  it('debe restaurar un usuario eliminado', async () => {
    await userService.registerUser(testUserData);
    await userService.eraseUser('juan@test.com');

    const restored = await userService.restoreUser('juan@test.com');
    expect(restored).toBeDefined();

    // El usuario debe ser encontrado de nuevo
    const found = await userService.searchUserByEmail('juan@test.com');
    expect(found).not.toBeNull();
    expect(found.email).toBe('juan@test.com');
  });

  it('debe lanzar error si no hay usuario eliminado con ese email', async () => {
    await expect(userService.restoreUser('noexiste@test.com'))
      .rejects.toThrow('No se encontró un usuario eliminado con ese email');
  });
});

describe('forgotPassword y resetPassword', () => {
  beforeEach(async () => {
    await userService.registerUser(testUserData);
  });

  it('debe generar un token de reset válido', async () => {
    const token = await userService.forgotPassword('juan@test.com');

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token).toHaveLength(64); // 32 bytes en hex = 64 chars
  });

  it('debe lanzar error si el email no existe', async () => {
    await expect(userService.forgotPassword('noexiste@test.com'))
      .rejects.toThrow('No existe un usuario con ese email');
  });

  it('debe restablecer la contraseña con un token válido', async () => {
    const token = await userService.forgotPassword('juan@test.com');
    const result = await userService.resetPassword(token, 'newPassword123');

    expect(result).toBe(true);

    // Verificar que la nueva contraseña funciona
    const user = await userService.loginUser({
      email: 'juan@test.com',
      password: 'newPassword123',
    });
    expect(user).toBeDefined();
  });

  it('debe lanzar error con un token inválido', async () => {
    const fakeToken = 'a'.repeat(64);

    await expect(userService.resetPassword(fakeToken, 'newPassword123'))
      .rejects.toThrow('Token inválido o expirado');
  });
});
