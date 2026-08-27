import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

export const qaController = {
  async getQuestions(req: Request, res: Response) {
    try {
      const eventId = req.params.eventId;
      
      // 1. Validate event ID
      if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
      }

      // 2. Verify that the event exists
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();
        
      if (eventError || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // 3. Fetch questions and their answers
      const { data: questions, error } = await supabase
        .from('event_questions')
        .select(`
          id,
          question,
          created_at,
          user_id,
          profile:profiles(id, full_name, avatar_url),
          answers:event_answers(
            id,
            answer,
            created_at,
            user_id,
            profile:profiles(id, full_name, avatar_url)
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        // Log the actual error to the backend terminal
        console.error('Supabase error fetching questions:', error);
        throw error;
      }
      
      // 5. Return an empty array when there are no questions
      res.status(200).json({ questions: questions || [] });
    } catch (error: any) {
      console.error('Error in getQuestions:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  },

  async askQuestion(req: AuthRequest, res: Response) {
    try {
      const eventId = req.params.eventId;
      const { question } = req.body;
      const user = req.user;

      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });

      // Validate event exists
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();
        
      if (eventError || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const { data, error } = await supabase
        .from('event_questions')
        .insert([{ event_id: eventId, user_id: user.id, question: question.trim() }])
        .select(`
          id,
          question,
          created_at,
          user_id,
          profile:profiles(id, full_name, avatar_url),
          answers:event_answers(*)
        `)
        .single();

      if (error) {
        console.error('Supabase error asking question:', error);
        throw error;
      }
      
      res.status(201).json({ question: data });
    } catch (error: any) {
      console.error('Error in askQuestion:', error);
      res.status(500).json({ error: 'Failed to ask question' });
    }
  },

  async answerQuestion(req: AuthRequest, res: Response) {
    try {
      const questionId = req.params.questionId;
      const { answer } = req.body;
      const user = req.user;

      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      if (!answer?.trim()) return res.status(400).json({ error: 'Answer is required' });

      const { data, error } = await supabase
        .from('event_answers')
        .insert([{ question_id: questionId, user_id: user.id, answer: answer.trim() }])
        .select(`
          id,
          answer,
          created_at,
          user_id,
          profile:profiles(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      
      res.status(201).json({ answer: data });
    } catch (error: any) {
      console.error('Error answering question:', error);
      res.status(500).json({ error: 'Failed to post answer' });
    }
  },

  async deleteQuestion(req: AuthRequest, res: Response) {
    try {
      const id = req.params.questionId;
      const user = req.user;

      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      // Check if question exists and who owns it
      const { data: question, error: fetchError } = await supabase
        .from('event_questions')
        .select('user_id')
        .eq('id', id)
        .single();
        
      if (fetchError || !question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      if (question.user_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own questions' });
      }

      const { error } = await supabase
        .from('event_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      res.status(200).json({ message: 'Question deleted' });
    } catch (error: any) {
      console.error('Error deleting question:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  },

  async deleteAnswer(req: AuthRequest, res: Response) {
    try {
      const id = req.params.answerId;
      const user = req.user;

      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      // Check if answer exists and who owns it
      const { data: answer, error: fetchError } = await supabase
        .from('event_answers')
        .select('user_id')
        .eq('id', id)
        .single();
        
      if (fetchError || !answer) {
        return res.status(404).json({ error: 'Answer not found' });
      }
      
      if (answer.user_id !== user.id) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own answers' });
      }

      const { error } = await supabase
        .from('event_answers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      res.status(200).json({ message: 'Answer deleted' });
    } catch (error: any) {
      console.error('Error deleting answer:', error);
      res.status(500).json({ error: 'Failed to delete answer' });
    }
  }
};
