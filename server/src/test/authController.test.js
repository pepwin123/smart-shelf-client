import { jest } from "@jest/globals";

process.env.JWT_SECRET = "test_secret";

const mockUserModel = { findOne: jest.fn(), create: jest.fn() };
const mockBcrypt = { compare: jest.fn(), genSalt: jest.fn(), hash: jest.fn() };
const mockJwt = { sign: jest.fn() };

jest.unstable_mockModule("bcryptjs", () => ({ default: mockBcrypt }));
jest.unstable_mockModule("jsonwebtoken", () => ({ default: mockJwt }));
jest.unstable_mockModule("../Models/authModel.js", () => ({ default: mockUserModel }));

const { login, signup } = await import("../Controllers/authController.js");

const createReqRes = () => ({
  req: { body: {} },
  res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
});

describe("Authentication Controller", () => {
  beforeEach(() => jest.clearAllMocks());

  //Groups all login-related tests
  describe("Login", () => {
    test("should successfully login user", async () => {
      const { req, res } = createReqRes();
      req.body = { email: "test@example.com", password: "password123" };
      
      mockUserModel.findOne.mockResolvedValue({ _id: "123", email: "test@example.com", username: "testuser", password: "hashed" });
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue("token123");

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: "token123" }));
    });

    test("should return error when user not found", async () => {
      const { req, res } = createReqRes();
      req.body = { email: "notfound@example.com", password: "password123" };
      mockUserModel.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "User not found" });
    });

    test("should return error on invalid password", async () => {
      const { req, res } = createReqRes();
      req.body = { email: "test@example.com", password: "wrongpassword" };
      
      mockUserModel.findOne.mockResolvedValue({ _id: "123", password: "hashed" });
      mockBcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid credentials" });
    });
  });

  describe("Signup", () => {
    test("should successfully create a new user", async () => {
      const { req, res } = createReqRes();
      req.body = { username: "newuser", email: "new@example.com", password: "pass123", confirmpassword: "pass123" };
      
      mockUserModel.findOne.mockResolvedValue(null);
      mockBcrypt.genSalt.mockResolvedValue("salt");
      mockBcrypt.hash.mockResolvedValue("hashed");
      mockUserModel.create.mockResolvedValue({ _id: "456", email: "new@example.com", username: "newuser" });
      mockJwt.sign.mockReturnValue("token456");

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: "token456" }));
    });

    test("should return error when passwords don't match", async () => {
      const { req, res } = createReqRes();
      req.body = { username: "user", email: "user@example.com", password: "pass123", confirmpassword: "different" };

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Passwords do not match" });
    });

    test("should return error when email already exists", async () => {
      const { req, res } = createReqRes();
      req.body = { username: "user", email: "existing@example.com", password: "pass123", confirmpassword: "pass123" };
      
      mockUserModel.findOne.mockResolvedValue({ _id: "999", email: "existing@example.com" });

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Email already exists" });
    });
  });
});
