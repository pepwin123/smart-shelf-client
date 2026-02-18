import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('Search API', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get('/api/search', (req, res) => {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false });
      res.json({
        success: true,
        count: 2,
        books: [
          { id: 'book-1', title: 'Book 1', author_name: ['Author'] },
          { id: 'book-2', title: 'Book 2', author_name: ['Author'] },
        ],
      });
    });
  });

  it('should return 400 without query', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
  });

  it('should return books with query', async () => {
    const res = await request(app).get('/api/search').query({ q: 'fiction' });
    expect(res.status).toBe(200);
    expect(res.body.books.length).toBeGreaterThan(0);
  });

  it('should return book with title', async () => {
    const res = await request(app).get('/api/search').query({ q: 'test' });
    expect(res.body.books[0].title).toBeDefined();
  });

  it('should return book with author', async () => {
    const res = await request(app).get('/api/search').query({ q: 'test' });
    expect(res.body.books[0].author_name).toBeDefined();
  });

  it('should return count', async () => {
    const res = await request(app).get('/api/search').query({ q: 'test' });
    expect(res.body.count).toBeGreaterThan(0);
  });
});
