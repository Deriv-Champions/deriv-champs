
-- Enable RLS for bookings and contact_messages if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Bookings policies for authenticated users
CREATE POLICY "Authenticated users can read bookings" 
ON public.bookings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can update bookings" 
ON public.bookings FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Contact messages policies for authenticated users
CREATE POLICY "Authenticated users can read contact_messages" 
ON public.contact_messages FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can update contact_messages" 
ON public.contact_messages FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contact_messages" 
ON public.contact_messages FOR DELETE 
TO authenticated 
USING (true);

-- Service role policies for edge functions
CREATE POLICY "Service role full access bookings" 
ON public.bookings FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role full access contact_messages" 
ON public.contact_messages FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
