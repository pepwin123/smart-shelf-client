import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('Manual Book APIs', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.post('/api/books/upload-cover', (req, res) => {
      if (!req.body.file) return res.status(400).json({ success: false });
      res.json({ success: true, url: 'http://localhost/cover.jpg' });
    });

    app.post('/api/books/upload', (req, res) => {
      if (!req.body.file) return res.status(400).json({ success: false });
      res.json({ success: true, url: 'http://localhost/content.pdf' });
    });

    app.post('/api/books/books', (req, res) => {
      const { title } = req.body;
      if (!title) return res.status(400).json({ success: false });
      res.status(201).json({ success: true, book: { title } });
    });
  });

  describe('Upload Cover', () => {
    it('should return 400 without file', async () => {
      const res = await request(app).post('/api/books/upload-cover').send({});
      expect(res.status).toBe(400);
    });

    it('should upload cover', async () => {
      const res = await request(app).post('/api/books/upload-cover').send({ file: 'cover.jpg' });
      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
    });
  });

  describe('Upload File', () => {
    it('should return 400 without file', async () => {
      const res = await request(app).post('/api/books/upload').send({});
      expect(res.status).toBe(400);
    });

    it('should upload file', async () => {
      const res = await request(app).post('/api/books/upload').send({ file: 'content.pdf' });
      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
    });
  });

  describe('Save Book', () => {
    it('should return 400 without title', async () => {
      const res = await request(app).post('/api/books/books').send({ author: 'Test' });
      expect(res.status).toBe(400);
    });

    it('should save book', async () => {
      const res = await request(app).post('/api/books/books').send({ title: 'Book 1' });
      expect(res.status).toBe(201);
      expect(res.body.book.title).toBe('Book 1');
    });
  });
});
