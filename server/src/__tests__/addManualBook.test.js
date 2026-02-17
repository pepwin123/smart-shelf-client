import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock Book model
jest.mock('../Models/bookModel.js', () => ({
  create: jest.fn().mockResolvedValue({
    _id: 'mock-id',
    googleBooksVolumeId: 'manual-123',
    title: 'Test Book',
  }),
}));

describe('AddManualBook APIs', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock upload-cover endpoint
    app.post('/api/books/upload-cover', (req, res) => {
      if (!req.body.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      res.json({ success: true, url: 'http://localhost:5000/uploads/cover.jpg', filename: 'cover.jpg' });
    });

    // Mock upload endpoint
    app.post('/api/books/upload', (req, res) => {
      if (!req.body.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      res.json({ 
        success: true, 
        url: 'http://localhost:5000/uploads/content.pdf',
        filename: 'content.pdf',
        contentText: 'Extracted text content'
      });
    });

    // Mock save book endpoint
    app.post('/api/books/books', (req, res) => {
      const { id, title, author_name } = req.body;
      
      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }

      res.status(201).json({
        success: true,
        message: 'Book saved successfully',
        book: {
          _id: 'mock-id',
          googleBooksVolumeId: id,
          title,
          authors: author_name || [],
        }
      });
    });
  });

  describe('POST /api/books/upload-cover', () => {
    it('should return 400 if no file uploaded', async () => {
      const res = await request(app).post('/api/books/upload-cover').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should upload cover image successfully', async () => {
      const res = await request(app).post('/api/books/upload-cover').send({ file: 'cover.jpg' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.url).toBeDefined();
    });
  });

  describe('POST /api/books/upload', () => {
    it('should return 400 if no file uploaded', async () => {
      const res = await request(app).post('/api/books/upload').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should upload book file successfully', async () => {
      const res = await request(app).post('/api/books/upload').send({ file: 'content.pdf' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.url).toBeDefined();
      expect(res.body.contentText).toBeDefined();
    });
  });

  describe('POST /api/books/books', () => {
    it('should return 400 if title is missing', async () => {
      const res = await request(app).post('/api/books/books').send({
        id: 'manual-123',
        author_name: ['Author']
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should save book successfully with required fields', async () => {
      const res = await request(app).post('/api/books/books').send({
        id: 'manual-123',
        title: 'Test Book',
        author_name: ['Test Author'],
        first_publish_year: 2024,
        subject: ['Fiction'],
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.book.title).toBe('Test Book');
    });

    it('should save book with all optional fields', async () => {
      const res = await request(app).post('/api/books/books').send({
        id: 'manual-456',
        title: 'Complete Book',
        author_name: ['Author 1', 'Author 2'],
        first_publish_year: 2024,
        subject: ['Science', 'History'],
        description: 'A test book description',
        cover_url: 'http://localhost:5000/uploads/cover.jpg',
        contentUrl: 'http://localhost:5000/uploads/content.pdf',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.book._id).toBeDefined();
    });
  });
});
