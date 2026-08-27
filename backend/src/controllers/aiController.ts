import { Request, Response } from 'express';
import { eventParser } from '../services/ai/eventParser';
import { eventModerator } from '../services/ai/eventModerator';
import { recommendationService } from '../services/ai/recommendationService';

export const aiController = {
  async parseEvent(req: Request, res: Response) {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
      
      const parsedData = await eventParser.parseEvent(prompt);
      res.status(200).json(parsedData);
    } catch (error: any) {
      console.error('Parse Event Error:', error);
      res.status(500).json({ error: 'Failed to parse event data' });
    }
  },

  async moderateEvent(req: Request, res: Response) {
    try {
      const { prompt, extractedData } = req.body;
      if (!prompt || !extractedData) return res.status(400).json({ error: 'Prompt and extractedData are required' });
      
      const moderationResult = await eventModerator.moderateEvent(prompt, extractedData);
      res.status(200).json(moderationResult);
    } catch (error: any) {
      console.error('Moderate Event Error:', error);
      res.status(500).json({ error: 'Failed to moderate event data' });
    }
  },

  async getRecommendations(req: Request, res: Response) {
    try {
      const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
      const lon = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
      // @ts-ignore
      const user = req.user; 
      
      const recommendations = await recommendationService.getRecommendations(lat, lon, user?.id, user?.token);
      res.status(200).json({ events: recommendations });
    } catch (error: any) {
      console.error('Recommendations Error:', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }
};
