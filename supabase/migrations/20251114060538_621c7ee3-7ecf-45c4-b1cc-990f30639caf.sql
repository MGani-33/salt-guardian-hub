-- Enable realtime for salt_minion_keys table
ALTER TABLE public.salt_minion_keys REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.salt_minion_keys;