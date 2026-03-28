
-- 1. Create Knowledge Base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add Lead Qualification Prompt to Agent Config
ALTER TABLE public.agent_config 
ADD COLUMN IF NOT EXISTS lead_qualification_prompt TEXT,
ADD COLUMN IF NOT EXISTS welcome_instructions TEXT;

-- 3. Seed agent_config with current hardcoded values
-- We use a COALESCE/UPDATE to ensure we don't overwrite user-customized fields if they exist
-- but since we're "migrating", we'll set them for the default agent.

UPDATE public.agent_config
SET 
  lead_qualification_prompt = 'You are a lead qualification assistant. Analyze the conversation and extract structured lead data.

QUALIFICATION STAGES:
- "new": Just started chatting, no meaningful info shared yet (Score 0-15)
- "contacted": Responded to initial outreach, minimal engagement (Score 16-30)
- "nurturing": Showing interest, asking questions, engaging in conversation (Score 31-50)
- "qualified": Shared key details (name, experience, interest area), clear intent (Score 51-75)
- "proposal": Asked about pricing, schedule, or specific training packages (Score 76-85)
- "negotiation": Discussing specifics, comparing options, close to decision (Score 86-92)
- "converted": Booked a session, committed to training, ready to start (Score 93-100)
- "lost": Explicitly declined, went silent after multiple follow-ups, or chose competitor

EXTRACT these fields (use null if not found):
- name: Full name
- email: Email address
- training_interest: One of "forex", "gold_xau", "binary_options", "1on1_mentorship", "group_training"
- experience_level: One of "beginner", "intermediate", "advanced"
- lead_score: 0-100 based on stage criteria above
- qualification_status: One of the stages above
- qualification_reason: A 2-3 sentence explanation of WHY you assigned this stage and score.
- key_interests: Array of specific topics they asked about
- objections: Any concerns or hesitations expressed
- next_action: Suggested follow-up action for the sales team

Return ONLY valid JSON, no other text.',
  welcome_instructions = 'LEAD QUALIFICATION INSTRUCTIONS:
IMPORTANT: Your VERY FIRST message to any new user MUST ask for their name in a warm, friendly way. For example: "Hey there! Welcome! I''m Steve. Before we dive in, what''s your name?" Do NOT proceed with any other questions until you know their name. Once they share their name, use it naturally throughout the conversation.

After getting their name, naturally gather the following information without being pushy:
1. Their trading experience level (beginner/intermediate/advanced)
2. What they''re interested in learning (Forex, Gold/XAU, Binary Options)
3. Their preferred training format (1-on-1 mentorship or group sessions)
4. Their goals and timeline
5. Their email (if not already known)

Ask ONE qualifying question at a time, weaved naturally into the conversation. Don''t interrogate.
When they show high intent (asking about pricing, scheduling, or saying they want to start), encourage them to book a session and provide Steve''s contact: +254 726 043 830.'
WHERE agent_name = 'Steve - Trading Mentor';

-- 4. RLS for Knowledge Base
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "knowledge_base_select" ON public.knowledge_base
FOR SELECT TO authenticated USING (true);

-- Allow admins (anyone in profiles) to manage
CREATE POLICY "knowledge_base_all" ON public.knowledge_base
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
