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

// Call Lovable AI gateway
async function callAI(
  messages: { role: string; content: string }[]
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  // Load agent config
  const { data: config } = await supabase
    .from("agent_config")
    .select("system_prompt, agent_name")
    .limit(1)
    .single();

  const systemPrompt = config?.system_prompt || "You are a helpful trading mentor assistant.";

  const fullMessages = [
    { role: "system", content: systemPrompt },
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
    const errText = await response.text();
    console.error("Lovable AI error:", response.status, errText);
    // Fallback to Gemini via same gateway with different model
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
      const fallbackErr = await fallback.text();
      throw new Error(`AI fallback failed [${fallback.status}]: ${fallbackErr}`);
    }
    const fallbackData = await fallback.json();
    return fallbackData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
}

// Extract lead info using AI
async function extractLeadInfo(conversationMessages: { role: string; content: string }[]): Promise<Record<string, any>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return {};

  const extractionPrompt = `Analyze this conversation and extract any lead information. Return a JSON object with these fields (use null for missing): name, email, training_interest (one of: "forex", "gold_xau", "binary_options", "1on1_mentorship", "group_training"), experience_level (one of: "beginner", "intermediate", "advanced"), lead_score (0-100 based on engagement and intent). Only return the JSON, no other text.`;

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
          { role: "system", content: extractionPrompt },
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

// Send WhatsApp message
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
    const err = await resp.text();
    console.error("WhatsApp send error:", resp.status, err);
  }
}

serve(async (req) => {
  // CORS
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
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages?.[0]) {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      const message = value.messages[0];
      const from = message.from; // phone number
      const contactName = value.contacts?.[0]?.profile?.name || null;
      const messageText = message.text?.body || "";

      if (!messageText) {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

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

      // Extract lead info periodically (every 3 messages)
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
          if (leadInfo.lead_score) leadData.lead_score = leadInfo.lead_score;

          // Upsert lead
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
