import express from "express";
import { login, signup } from "../Controllers/authController.js";
import auth from "../Middleware/authMiddleware.js"

const router = express.Router();

router.post('/login',login);
router.post('/register', signup);

router.get("/me", auth, (req, res) => {
  res.status(200).json(req.user);
});

export default router;