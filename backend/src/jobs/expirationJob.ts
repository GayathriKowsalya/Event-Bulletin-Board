import { supabase } from '../config/supabase';

export const expirePastEvents = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('events')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('event_date', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('Failed to expire events:', error);
    throw error;
  }

  return data ? data.length : 0;
};
