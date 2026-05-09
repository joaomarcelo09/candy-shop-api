import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt-token'),
    } as unknown as jest.Mocked<JwtService>;

    authService = new AuthService(usersService, jwtService);
  });

  it('registers a user with hashed password and returns a token', async () => {
    usersService.create.mockImplementation(async (payload) => ({
      id: 'user-1',
      name: payload.name,
      email: payload.email,
      password: payload.password,
      createdAt: new Date('2026-05-08T13:00:00.000Z'),
    }));

    const result = await authService.register({
      name: 'John',
      email: 'john@email.com',
      password: '123456',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John',
        email: 'john@email.com',
        password: expect.any(String),
      }),
    );

    const hashedPassword = usersService.create.mock.calls[0][0].password;
    expect(await bcrypt.compare('123456', hashedPassword)).toBe(true);
    expect(result).toEqual({
      user: {
        id: 'user-1',
        name: 'John',
        email: 'john@email.com',
        createdAt: new Date('2026-05-08T13:00:00.000Z'),
      },
      token: 'jwt-token',
    });
  });

  it('returns a token when credentials are valid', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'John',
      email: 'john@email.com',
      password: await bcrypt.hash('123456', 10),
      createdAt: new Date(),
    });

    await expect(
      authService.login({ email: 'john@email.com', password: '123456' }),
    ).resolves.toEqual({ token: 'jwt-token' });
  });

  it('throws when credentials are invalid', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'john@email.com', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
