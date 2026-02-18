import { describe, it, expect, beforeEach, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret';

const mockUser = { findOne: jest.fn(), create: jest.fn() };
const mockBcrypt = { compare: jest.fn(), hash: jest.fn(), genSalt: jest.fn() };
const mockJwt = { sign: jest.fn() };

jest.unstable_mockModule('bcryptjs', () => ({ default: mockBcrypt }));
jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
jest.unstable_mockModule('../Models/authModel.js', () => ({ default: mockUser }));

const { login, signup } = await import('../Controllers/authController.js'); 

describe('Auth', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Login', () => {
    it('should login', async () => {
      const req = { body: { email: 'test@example.com', password: 'pass123' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      mockUser.findOne.mockResolvedValue({ _id: '123', password: 'hashed' });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token123');
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should fail if user not found', async () => {
      const req = { body: { email: 'test@example.com', password: 'pass123' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      mockUser.findOne.mockResolvedValue(null);
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail with wrong password', async () => {
      const req = { body: { email: 'test@example.com', password: 'pass123' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      mockUser.findOne.mockResolvedValue({ _id: '123', password: 'hashed' });
      mockBcrypt.compare.mockResolvedValue(false);
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Signup', () => {
    it('should signup', async () => {
      const req = { body: { username: 'user1', email: 'user@example.com', password: 'pass123', confirmpassword: 'pass123' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      mockUser.findOne.mockResolvedValue(null);
      mockBcrypt.genSalt.mockResolvedValue('salt');
      mockBcrypt.hash.mockResolvedValue('hashed');
      mockUser.create.mockResolvedValue({ _id: '456', email: 'user@example.com' });
      mockJwt.sign.mockReturnValue('token456');
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should fail if passwords mismatch', async () => {
      const req = { body: { username: 'user1', email: 'user@example.com', password: 'pass123', confirmpassword: 'pass456' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail if email exists', async () => {
      const req = { body: { username: 'user1', email: 'user@example.com', password: 'pass123', confirmpassword: 'pass123' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      mockUser.findOne.mockResolvedValue({ _id: '999', email: 'user@example.com' });
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
