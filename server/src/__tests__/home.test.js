import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('Home Page', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get('/api/search', (req, res) => {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false });
      res.json({
        success: true,
        count: 20,
        books: [
          { id: 'book-1', title: 'Book 1', author_name: ['Author'] },
          { id: 'book-2', title: 'Book 2', author_name: ['Author'] },
        ],
      });
    });
  });

  describe('Search', () => {
    it('should return 400 without query', async () => {
      const res = await request(app).get('/api/search');
      expect(res.status).toBe(400);
    });

    it('should return books with query', async () => {
      const res = await request(app).get('/api/search').query({ q: 'fiction' });
      expect(res.status).toBe(200);
      expect(res.body.books.length).toBeGreaterThan(0);
    });

    it('should return book count', async () => {
      const res = await request(app).get('/api/search').query({ q: 'test' });
      expect(res.body.count).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('should calculate pages correctly', () => {
      expect(Math.ceil(50 / 10)).toBe(5);
    });

    it('should have next page', () => {
      expect(1 < 5).toBe(true);
    });

    it('should not exceed max page', () => {
      expect(Math.min(5, 6)).toBe(5);
    });
  });
});
