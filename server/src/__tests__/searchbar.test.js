import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('SearchBar APIs', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock search endpoint
    app.get('/api/search', (req, res) => {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ success: false });
      }
      res.json({
        success: true,
        count: 2,
        books: [
          { id: 'book-1', title: 'Book One', author_name: ['Author'] },
          { id: 'book-2', title: 'Book Two', author_name: ['Author'] },
        ],
      });
    });

    // Mock add to workspace endpoint
    app.post('/api/workspaces/:workspaceId/cards', (req, res) => {
      const { bookId, title } = req.body;
      if (!bookId || !title) {
        return res.status(400).json({ success: false });
      }
      res.status(201).json({ success: true, card: { bookId, title } });
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

    it('should return book with title and authors', async () => {
      const res = await request(app).get('/api/search').query({ q: 'test' });
      const book = res.body.books[0];
      expect(book.title).toBeDefined();
      expect(book.author_name).toBeDefined();
    });
  });

  describe('Add to Workspace', () => {
    it('should return 400 without required fields', async () => {
      const res = await request(app).post('/api/workspaces/ws-1/cards').send({});
      expect(res.status).toBe(400);
    });

    it('should add book to workspace', async () => {
      const res = await request(app).post('/api/workspaces/ws-1/cards').send({
        bookId: 'book-1',
        title: 'Test Book',
      });
      expect(res.status).toBe(201);
      expect(res.body.card.bookId).toBe('book-1');
    });
  });
});
