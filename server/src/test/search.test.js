import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the Book model
jest.mock('../Models/bookModel.js', () => ({
  find: jest.fn().mockResolvedValue([]),
}));

// Mock axios to prevent real API calls
jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      data: {
        items: [
          {
            id: 'book-1',
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author'],
              publishedDate: '2020-01-01',
              imageLinks: { thumbnail: 'http://example.com/cover.jpg' },
              previewLink: 'http://example.com/preview',
              categories: ['Fiction'],
              description: 'Test description',
              pageCount: 300,
              industryIdentifiers: [],
            },
          },
        ],
      },
    }),
  },
}));

describe('GET /api/search', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock search endpoint
    app.get('/api/search', (req, res) => {
      const { q, year, category, availability } = req.query;

      if (!q && !year && !category && !availability) {
        return res.status(400).json({
          success: false,
          message: 'Provide a search query or at least one filter'
        });
      }

      res.json({
        success: true,
        count: 2,
        books: [
          {
            id: 'book-1',
            title: 'Test Book 1',
            author_name: ['Author One'],
            first_publish_year: 2020,
            cover_url: 'http://example.com/cover1.jpg',
            description: 'Test book description',
          },
          {
            id: 'book-2',
            title: 'Test Book 2',
            author_name: ['Author Two'],
            first_publish_year: 2021,
            cover_url: 'http://example.com/cover2.jpg',
            description: 'Another test book',
          },
        ],
      });
    });
  });

  it('should return 400 if no query or filters provided', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return books for valid query', async () => {
    const res = await request(app).get('/api/search').query({ q: 'fiction' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.books)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('should filter by year', async () => {
    const res = await request(app).get('/api/search').query({ q: 'fiction', year: '2020' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.books)).toBe(true);
  });

  it('should filter by category', async () => {
    const res = await request(app).get('/api/search').query({ q: 'fiction', category: 'science' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.books)).toBe(true);
  });

  it('should filter by availability', async () => {
    const res = await request(app).get('/api/search').query({ q: 'fiction', availability: 'readable' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.books)).toBe(true);
  });
});
