import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─────────────────────────────────────────────
// TRIGGER DETECTION
// ─────────────────────────────────────────────
function isAdTrigger(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(k => lowerText.includes(k.toLowerCase()));
}

// ─────────────────────────────────────────────
// WHATSAPP SENDERS
// ─────────────────────────────────────────────

async function sendTextMessage(to: string, text: string) {
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
  if (!resp.ok) console.error("WhatsApp text send error:", resp.status, await resp.text());
}

async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[]
) {
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
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: bodyText },
          action: {
            buttons: buttons.map((b) => ({
              type: "reply",
              reply: { id: b.id, title: b.title },
            })),
          },
        },
      }),
    }
  );
  if (!resp.ok) console.error("WhatsApp button send error:", resp.status, await resp.text());
}

// ─────────────────────────────────────────────
// AI PROVIDER LAYER
// ─────────────────────────────────────────────

async function callAIWithFallback(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  // Try Lovable First
  if (LOVABLE_API_KEY) {
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.choices?.[0]?.message?.content;
      }
    } catch (e) { console.error("Lovable error:", e); }
  }

  // Fallback to Gemini Direct
  if (GEMINI_API_KEY) {
    try {
      const geminiContents = [
        { role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS: ${systemPrompt}` }] },
        { role: "model", parts: [{ text: "Understood. I will act as instructed." }] },
        ...messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
      ];
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: geminiContents }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      }
    } catch (e) { console.error("Gemini error:", e); }
  }

  return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a bit. 🙏";
}

// ─────────────────────────────────────────────
// DYNAMIC AI HANDLERS
// ─────────────────────────────────────────────

async function handleAIReply(
  from: string,
  conversation: any,
  config: any,
  knowledge: string,
  mode: "post_onboarding" | "freeform_qa"
) {
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(10);

  const historyMessages = (history || []).map(m => ({ role: m.role, content: m.content }));
  const metadata = conversation.metadata || {};

  const nameContext = metadata.captured_name ? `The user's name is ${metadata.captured_name}.` : "";
  const onboardingContext = `ONBOARDING CONTEXT:
Experience: ${metadata.q1_experience || "Unknown"}
Weekly Time: ${metadata.q2_time || "Unknown"}
Goal: ${metadata.q3_goal || "Unknown"}`;

  const finalSystemPrompt = `${config.system_prompt}

${config.agent_name} context:
${nameContext}
${onboardingContext}

MODE: ${mode === "freeform_qa" ? "Helpful Q&A" : "Post-Onboarding Followup"}
${config.welcome_instructions}

BUSINESS KNOWLEDGE:
${knowledge}

Always stay in character as ${config.agent_name}. Keep responses concise for WhatsApp.`;

  const aiResponse = await callAIWithFallback(finalSystemPrompt, historyMessages);

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    role: "assistant",
    content: aiResponse,
  });

  await sendTextMessage(from, aiResponse);

  // Periodic lead extraction (every 3 user messages approximately)
  if (historyMessages.filter(m => m.role === "user").length % 3 === 0) {
    const leadPrompt = `${config.lead_qualification_prompt}
    
Current Conversation Data:
Name: ${metadata.captured_name || "Unknown"}
Experience: ${metadata.q1_experience || "Unknown"}
Goal: ${metadata.q3_goal || "Unknown"}

Return valid JSON.`;

    const leadRaw = await callAIWithFallback(leadPrompt, historyMessages);
    const jsonMatch = leadRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const leadInfo = JSON.parse(jsonMatch[0]);
      await supabase.from("leads").upsert({
        whatsapp_phone: from,
        conversation_id: conversation.id,
        name: metadata.captured_name || leadInfo.name,
        email: leadInfo.email,
        training_interest: leadInfo.training_interest,
        experience_level: metadata.q1_experience || leadInfo.experience_level,
        status: leadInfo.qualification_status,
        lead_score: leadInfo.lead_score,
        notes: `AI Extraction: ${leadInfo.qualification_reason} | Next: ${leadInfo.next_action}`,
        extracted_data: leadInfo
      }, { onConflict: "whatsapp_phone" });
    }
  }
}

// ─────────────────────────────────────────────
// MAIN SERVE HANDLER
// ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // 1. Webhook Verification
  if (req.method === "GET") {
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (url.searchParams.get("hub.verify_token") === verifyToken) {
      return new Response(url.searchParams.get("hub.challenge"), { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // 2. Message Processing
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message) return new Response("OK", { status: 200 });

      const from = message.from;
      let text = (message.text?.body || "").trim();
      let buttonId = "";

      if (message.type === "interactive") {
        buttonId = message.interactive?.button_reply?.id || "";
        text = message.interactive?.button_reply?.title || "";
      }

      // --- FETCH DYNAMIC CONFIG ---
      const [{ data: config }, { data: kbData }] = await Promise.all([
        supabase.from("agent_config").select("*").limit(1).single(),
        supabase.from("knowledge_base").select("content").limit(10)
      ]);
      const knowledge = kbData?.map(k => k.content).join("\n\n") || "";

      if (!config) throw new Error("Agent configuration not found");

      // --- GET CONVERSATION ---
      let { data: conversation } = await supabase
        .from("conversations")
        .select("*")
        .eq("whatsapp_phone", from)
        .single();

      if (!conversation) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            whatsapp_phone: from,
            whatsapp_name: body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name,
            metadata: { onboarding_state: "idle" }
          })
          .select("*")
          .single();
        conversation = newConv;
      }

      const metadata = conversation.metadata || {};
      let state = metadata.onboarding_state || "idle";

      // Save user message
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        role: "user",
        content: text || buttonId
      });

      // --- STATE MACHINE ---
      const quiz = config.onboarding_quiz || {};
      const menu = config.initial_menu || {};

      if (state === "idle") {
        if (isAdTrigger(text, config.ad_trigger_keywords || [])) {
          await sendInteractiveButtons(from, quiz.welcome.body, quiz.welcome.buttons);
          state = "q1_pending";
        } else {
          await sendInteractiveButtons(from, menu.body, menu.buttons);
          state = "choice_pending";
        }

      } else if (state === "choice_pending") {
        if (buttonId === "choice_learn" || isAdTrigger(text, config.ad_trigger_keywords || [])) {
          await sendInteractiveButtons(from, quiz.welcome.body, quiz.welcome.buttons);
          state = "q1_pending";
        } else if (buttonId === "choice_ask") {
          await sendTextMessage(from, "Sure! 💬 What's on your mind? Ask me anything about trading.");
          state = "freeform";
        } else {
          await sendInteractiveButtons(from, menu.body, menu.buttons);
        }

      } else if (state === "q1_pending") {
        if (buttonId === "start_yes") {
          const q = quiz.questions[0];
          await sendInteractiveButtons(from, q.text, q.options);
          state = "q1_answered";
        }

      } else if (state === "q1_answered") {
        metadata.q1_experience = buttonId || text;
        const q = quiz.questions[1];
        await sendInteractiveButtons(from, q.text, q.options);
        state = "q2_answered";

      } else if (state === "q2_answered") {
        metadata.q2_time = buttonId || text;
        const q = quiz.questions[2];
        await sendInteractiveButtons(from, q.text, q.options);
        state = "q3_answered";

      } else if (state === "q3_answered") {
        metadata.q3_goal = buttonId || text;
        const rec = quiz.recommendation;
        const isIntermediate = rec.intermediate_triggers?.includes(metadata.q1_experience);
        const program = isIntermediate ? "Intermediate" : "Beginner";
        const body = rec.base_text.replace("{program}", program);
        await sendInteractiveButtons(from, body, [rec.details_button]);
        state = "details_pending";

      } else if (state === "details_pending") {
        if (buttonId === "send_details") {
          await sendTextMessage(from, `Here are your full program details 👇\n\n${quiz.details.link}`);
          await new Promise(r => setTimeout(r, 1000));
          await sendTextMessage(from, quiz.details.message);
          state = "name_pending";
        }

      } else if (state === "name_pending") {
        metadata.captured_name = text;
        const handoff = quiz.handoff.replace("{name}", text);
        await sendTextMessage(from, handoff);
        state = "name_done";

      } else if (state === "freeform") {
        await handleAIReply(from, conversation, config, knowledge, "freeform_qa");
      } else {
        await handleAIReply(from, conversation, config, knowledge, "post_onboarding");
      }

      // Persist state
      metadata.onboarding_state = state;
      await supabase.from("conversations").update({ metadata }).eq("id", conversation.id);

      return new Response("OK", { status: 200 });
    } catch (e) {
      console.error("Critical webhook error:", e);
      return new Response("Error", { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});