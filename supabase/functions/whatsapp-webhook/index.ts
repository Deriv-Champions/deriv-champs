import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Lead qualification criteria
const LEAD_QUALIFICATION_PROMPT = `You are a lead qualification assistant. Analyze the conversation and extract structured lead data.

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
- qualification_reason: A 2-3 sentence explanation of WHY you assigned this stage and score. Reference specific things the user said or did in the conversation.
- key_interests: Array of specific topics they asked about
- objections: Any concerns or hesitations expressed
- next_action: Suggested follow-up action for the sales team

Return ONLY valid JSON, no other text.`;

async function callAI(
  messages: { role: string; content: string }[]
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const { data: config } = await supabase
    .from("agent_config")
    .select("system_prompt, agent_name")
    .limit(1)
    .single();

  const systemPrompt = config?.system_prompt || "You are a helpful trading mentor assistant.";

  // Inject lead qualification instructions into the system prompt
  const enhancedPrompt = `${systemPrompt}

LEAD QUALIFICATION INSTRUCTIONS:
As you chat, naturally gather the following information without being pushy:
1. Their name (ask early in a friendly way)
2. Their trading experience level (beginner/intermediate/advanced)
3. What they're interested in learning (Forex, Gold/XAU, Binary Options)
4. Their preferred training format (1-on-1 mentorship or group sessions)
5. Their goals and timeline
6. Their phone number and email (if not already known from WhatsApp)

Ask ONE qualifying question at a time, weaved naturally into the conversation. Don't interrogate.
When they show high intent (asking about pricing, scheduling, or saying they want to start), encourage them to book a session and provide Steve's contact: +254 726 043 830.`;

  const fullMessages = [
    { role: "system", content: enhancedPrompt },
    ...messages,
  ];

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: fullMessages,
      }),
    }
  );

  if (!response.ok) {
    console.error("Lovable AI error:", response.status, await response.text());
    const fallback = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: fullMessages,
        }),
      }
    );
    if (!fallback.ok) {
      throw new Error(`AI fallback failed [${fallback.status}]`);
    }
    const fallbackData = await fallback.json();
    return fallbackData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
}

async function extractLeadInfo(
  conversationMessages: { role: string; content: string }[]
): Promise<Record<string, any>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return {};

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: LEAD_QUALIFICATION_PROMPT },
          ...conversationMessages.slice(-10),
        ],
      }),
    });

    if (!resp.ok) return {};
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Lead extraction error:", e);
  }
  return {};
}

async function sendWhatsAppMessage(to: string, text: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("WhatsApp credentials not configured");

  const resp = await fetch(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!resp.ok) {
    console.error("WhatsApp send error:", resp.status, await resp.text());
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Webhook verification (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Webhook message (POST)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message?.text?.body) {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const from = message.from;
      const contactName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || null;
      const messageText = message.text.body;

      // Get or create conversation
      let { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("whatsapp_phone", from)
        .single();

      if (!conversation) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ whatsapp_phone: from, whatsapp_name: contactName })
          .select("id")
          .single();
        conversation = newConv;
      } else if (contactName) {
        await supabase
          .from("conversations")
          .update({ whatsapp_name: contactName, updated_at: new Date().toISOString() })
          .eq("id", conversation.id);
      }

      if (!conversation) {
        console.error("Failed to create/get conversation");
        return new Response("Error", { status: 500, headers: corsHeaders });
      }

      // Save user message
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        role: "user",
        content: messageText,
      });

      // Get conversation history
      const { data: history } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
        .limit(20);

      const conversationMessages = (history || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Generate AI response
      const aiResponse = await callAI(conversationMessages);

      // Save assistant message
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: aiResponse,
      });

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversation.id);

      // Extract lead info every 3 messages or on first 2
      if (conversationMessages.length % 3 === 0 || conversationMessages.length <= 2) {
        const leadInfo = await extractLeadInfo(conversationMessages);
        if (Object.keys(leadInfo).length > 0) {
          const leadData: Record<string, any> = {
            conversation_id: conversation.id,
            whatsapp_phone: from,
            extracted_data: leadInfo,
          };
          if (leadInfo.name) leadData.name = leadInfo.name;
          if (leadInfo.email) leadData.email = leadInfo.email;
          if (leadInfo.training_interest) leadData.training_interest = leadInfo.training_interest;
          if (leadInfo.experience_level) leadData.experience_level = leadInfo.experience_level;
          if (typeof leadInfo.lead_score === "number") leadData.lead_score = leadInfo.lead_score;

          // Map qualification status to lead status
          if (leadInfo.qualification_status === "hot_lead") leadData.status = "qualified";
          else if (leadInfo.qualification_status === "qualified") leadData.status = "qualified";
          else if (leadInfo.qualification_status === "nurturing") leadData.status = "contacted";

          // Store notes with next action and objections
          const notes: string[] = [];
          if (leadInfo.next_action) notes.push(`Next: ${leadInfo.next_action}`);
          if (leadInfo.objections) notes.push(`Objections: ${leadInfo.objections}`);
          if (leadInfo.key_interests?.length) notes.push(`Interests: ${leadInfo.key_interests.join(", ")}`);
          if (notes.length) leadData.notes = notes.join(" | ");

          await supabase
            .from("leads")
            .upsert(leadData, { onConflict: "whatsapp_phone" });
        }
      }

      // Send reply via WhatsApp
      await sendWhatsAppMessage(from, aiResponse);

      return new Response("OK", { status: 200, headers: corsHeaders });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Error", { status: 500, headers: corsHeaders });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
