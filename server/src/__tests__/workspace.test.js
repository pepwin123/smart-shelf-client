import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

describe('Workspace APIs', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock get workspaces endpoint
    app.get('/api/workspaces', (req, res) => {
      res.json({
        workspaces: [
          { _id: 'ws-1', name: 'Reading List', description: 'My books' },
          { _id: 'ws-2', name: 'To Read', description: 'Future reads' },
        ],
      });
    });

    // Mock create workspace endpoint
    app.post('/api/workspaces', (req, res) => {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false });
      }
      res.status(201).json({
        workspace: { _id: 'ws-3', name, description },
      });
    });

    // Mock get workspace cards endpoint
    app.get('/api/workspaces/:id/cards', (req, res) => {
      res.json({
        cards: [
          { _id: 'card-1', title: 'Book 1', author: 'Author 1', columnId: 'col-1' },
          { _id: 'card-2', title: 'Book 2', author: 'Author 2', columnId: 'col-1' },
        ],
      });
    });

    // Mock delete card endpoint
    app.delete('/api/workspaces/:workspaceId/cards/:cardId', (req, res) => {
      res.json({ success: true });
    });

    // Mock update card endpoint
    app.put('/api/workspaces/:workspaceId/cards/:cardId', (req, res) => {
      const { columnId } = req.body;
      if (!columnId) {
        return res.status(400).json({ success: false });
      }
      res.json({ success: true, card: { columnId } });
    });
  });

  describe('Get Workspaces', () => {
    it('should fetch all workspaces', async () => {
      const res = await request(app).get('/api/workspaces');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.workspaces)).toBe(true);
    });

    it('should return workspace with _id and name', async () => {
      const res = await request(app).get('/api/workspaces');
      const ws = res.body.workspaces[0];
      expect(ws._id).toBeDefined();
      expect(ws.name).toBeDefined();
    });
  });

  describe('Create Workspace', () => {
    it('should return 400 without name', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .send({ description: 'test' });
      expect(res.status).toBe(400);
    });

    it('should create workspace with name', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .send({ name: 'New Workspace', description: 'Desc' });
      expect(res.status).toBe(201);
      expect(res.body.workspace.name).toBe('New Workspace');
    });
  });

  describe('Workspace Cards', () => {
    it('should fetch cards for workspace', async () => {
      const res = await request(app).get('/api/workspaces/ws-1/cards');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.cards)).toBe(true);
    });

    it('should delete card from workspace', async () => {
      const res = await request(app)
        .delete('/api/workspaces/ws-1/cards/card-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when updating card without columnId', async () => {
      const res = await request(app)
        .put('/api/workspaces/ws-1/cards/card-1')
        .send({});
      expect(res.status).toBe(400);
    });

    it('should update card column', async () => {
      const res = await request(app)
        .put('/api/workspaces/ws-1/cards/card-1')
        .send({ columnId: 'col-2' });
      expect(res.status).toBe(200);
      expect(res.body.card.columnId).toBe('col-2');
    });
  });
});