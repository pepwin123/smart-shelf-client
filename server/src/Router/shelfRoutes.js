import express from "express";

const router = express.Router();

// Placeholder routes for shelves — implement real logic in Controllers later
router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Shelves route is working' });
});

export default router;
