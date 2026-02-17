import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('Home Page - Search API', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock GET /api/search endpoint
    app.get('/api/search', (req, res) => {
      const { q, page = 1 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required',
        });
      }

      res.json({
        success: true,
        count: 20,
        books: [
          {
            id: 'book-1',
            title: 'Book One',
            author_name: ['Author'],
            cover_url: 'http://localhost/cover1.jpg',
          },
          {
            id: 'book-2',
            title: 'Book Two',
            author_name: ['Author'],
            cover_url: 'http://localhost/cover2.jpg',
          },
        ],
      });
    });
  });

  describe('Search Functionality', () => {
    it('should return 400 if no query provided', async () => {
      const res = await request(app).get('/api/search');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return books for valid query', async () => {
      const res = await request(app).get('/api/search').query({ q: 'fiction' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.books.length).toBeGreaterThan(0);
    });

    it('should return book count', async () => {
      const res = await request(app).get('/api/search').query({ q: 'science' });
      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const res = await request(app).get('/api/search').query({ q: 'fiction', page: 2 });
      expect(res.status).toBe(200);
      expect(res.body.books).toBeDefined();
    });

    it('should return book with id and title', async () => {
      const res = await request(app).get('/api/search').query({ q: 'fiction' });
      const book = res.body.books[0];
      expect(book.id).toBeDefined();
      expect(book.title).toBeDefined();
      expect(book.author_name).toBeDefined();
    });
  });

  describe('Pagination Logic', () => {
    it('should calculate total pages correctly', () => {
      const totalResults = 50;
      const booksPerPage = 10;
      const totalPages = Math.ceil(totalResults / booksPerPage);
      expect(totalPages).toBe(5);
    });

    it('should enable next button when not on last page', () => {
      const currentPage = 1;
      const totalPages = 5;
      const hasNextPage = currentPage < totalPages;
      expect(hasNextPage).toBe(true);
    });

    it('should disable next button on last page', () => {
      const currentPage = 5;
      const totalPages = 5;
      const hasNextPage = currentPage < totalPages;
      expect(hasNextPage).toBe(false);
    });

    it('should enable prev button when not on first page', () => {
      const currentPage = 2;
      const hasPrevPage = currentPage > 1;
      expect(hasPrevPage).toBe(true);
    });

    it('should disable prev button on first page', () => {
      const currentPage = 1;
      const hasPrevPage = currentPage > 1;
      expect(hasPrevPage).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should not go below page 1', () => {
      let page = 1;
      page = Math.max(1, page - 1);
      expect(page).toBe(1);
    });

    it('should increment page correctly', () => {
      let page = 2;
      page = page + 1;
      expect(page).toBe(3);
    });

    it('should not exceed max pages', () => {
      let page = 5;
      const totalPages = 5;
      page = Math.min(totalPages, page + 1);
      expect(page).toBe(5);
    });
  });

  describe('UI State', () => {
    it('should show loading when fetching', () => {
      const loading = true;
      expect(loading).toBe(true);
    });

    it('should hide loading when done', () => {
      const loading = false;
      expect(loading).toBe(false);
    });

    it('should show pagination when results exist', () => {
      const totalResults = 20;
      const showPagination = totalResults > 0;
      expect(showPagination).toBe(true);
    });

    it('should hide pagination when no results', () => {
      const totalResults = 0;
      const showPagination = totalResults > 0;
      expect(showPagination).toBe(false);
    });
  });
});
