-- Add recipient_id to support_tickets table
ALTER TABLE public.support_tickets
ADD COLUMN recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.support_tickets.recipient_id IS 'Optional: specific user to receive this ticket (for instructor-to-instructor or instructor-to-admin communication)';

-- Add file attachment columns to support_tickets table
ALTER TABLE public.support_tickets
ADD COLUMN file_url text,
ADD COLUMN file_name text,
ADD COLUMN file_type text,
ADD COLUMN file_size integer;

-- Update RLS policy to allow instructors to view tickets sent to them
CREATE POLICY "Users can view tickets sent to them"
ON public.support_tickets
FOR SELECT
USING (auth.uid() = recipient_id);