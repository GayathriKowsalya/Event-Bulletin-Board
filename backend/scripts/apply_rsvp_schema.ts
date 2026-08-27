import { Client } from 'pg';

async function applyRsvpSchema() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
  });

  try {
    await client.connect();
    
    // 1. Add rsvp_count column to events
    console.log("Adding rsvp_count column to events...");
    await client.query(`
      ALTER TABLE public.events 
      ADD COLUMN IF NOT EXISTS rsvp_count integer NOT NULL DEFAULT 0;
    `);

    // 2. Update existing rows to have the correct rsvp_count
    console.log("Updating existing rsvp_count values...");
    await client.query(`
      UPDATE public.events e
      SET rsvp_count = (
        SELECT count(*) 
        FROM public.event_registrations er 
        WHERE er.event_id = e.id AND er.status = 'registered'
      );
    `);

    // 3. Create or replace the trigger function
    console.log("Creating trigger function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_event_rsvp_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' AND NEW.status = 'registered' THEN
          UPDATE public.events 
          SET rsvp_count = rsvp_count + 1 
          WHERE id = NEW.event_id;
        ELSIF TG_OP = 'DELETE' AND OLD.status = 'registered' THEN
          UPDATE public.events 
          SET rsvp_count = rsvp_count - 1 
          WHERE id = OLD.event_id;
        ELSIF TG_OP = 'UPDATE' THEN
          IF NEW.status = 'registered' AND OLD.status != 'registered' THEN
            UPDATE public.events 
            SET rsvp_count = rsvp_count + 1 
            WHERE id = NEW.event_id;
          ELSIF NEW.status != 'registered' AND OLD.status = 'registered' THEN
            UPDATE public.events 
            SET rsvp_count = rsvp_count - 1 
            WHERE id = NEW.event_id;
          END IF;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 4. Create the trigger
    console.log("Creating trigger...");
    await client.query(`
      DROP TRIGGER IF EXISTS update_rsvp_count_trigger ON public.event_registrations;
      CREATE TRIGGER update_rsvp_count_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
      FOR EACH ROW EXECUTE FUNCTION public.update_event_rsvp_count();
    `);

    console.log("Schema update completed successfully.");
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

applyRsvpSchema();
