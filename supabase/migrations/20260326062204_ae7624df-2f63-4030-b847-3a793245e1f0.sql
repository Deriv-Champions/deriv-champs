
-- Agent configuration table
CREATE TABLE public.agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL DEFAULT 'Steve - Trading Mentor',
  system_prompt TEXT NOT NULL DEFAULT 'You are Steve, a professional Deriv trader and trading mentor based in Kisumu, Kenya. You specialise in Forex currency pairs, Gold (XAU/USD), and Deriv Binary Options. Your mission is to help serious traders build skills, structure, and mental edge for consistent performance. You offer 1-on-1 mentorship and group training sessions, both online and in-person. Be friendly, professional, and always try to qualify leads by asking about their trading experience, interests (Forex, Gold, Binary Options), and goals. Collect their name, phone number, email, and preferred training format when appropriate.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default config
INSERT INTO public.agent_config (agent_name) VALUES ('Steve - Trading Mentor');

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_phone TEXT NOT NULL,
  whatsapp_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_conversations_phone ON public.conversations (whatsapp_phone);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages (conversation_id, created_at);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  whatsapp_phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  training_interest TEXT,
  experience_level TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes TEXT,
  lead_score INTEGER DEFAULT 0,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_leads_phone ON public.leads (whatsapp_phone);

-- Enable RLS but allow edge functions (service role) full access
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public read policies for admin dashboard (authenticated users)
CREATE POLICY "Authenticated users can read agent_config" ON public.agent_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update agent_config" ON public.agent_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Service role policies for edge functions (insert/update)
CREATE POLICY "Service role full access agent_config" ON public.agent_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access conversations" ON public.conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access messages" ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access leads" ON public.leads FOR ALL TO service_role USING (true) WITH CHECK (true);
