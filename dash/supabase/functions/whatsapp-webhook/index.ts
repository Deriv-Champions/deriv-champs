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
// IA ACTION HELPERS (Bookings & Contacts)
// ─────────────────────────────────────────────

async function processAIActions(text: string) {
  let cleanText = text;
  const actionRegex = /\[ACTION:\s*(\w+)\s*(\{[\s\S]*?\})\]/g;
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    const [fullTag, actionType, payloadStr] = match;
    try {
      const payload = JSON.parse(payloadStr);
      console.log(`Executing AI Action: ${actionType}`, payload);

      if (actionType === "CREATE_BOOKING") {
        await supabase.from("bookings").insert({
          first_name: payload.first_name,
          last_name: payload.last_name || "",
          email: payload.email,
          phone: payload.phone,
          programme_id: payload.programme_id,
          booking_date: payload.booking_date,
          start_time: payload.start_time,
          is_online: payload.is_online !== undefined ? payload.is_online : true,
          message: payload.message || "Booked via AI Assistant",
          status: "pending"
        });
      } else if (actionType === "SEND_CONTACT") {
        await supabase.from("contact_messages").insert({
          name: payload.name,
          email: payload.email,
          subject: payload.subject || "WhatsApp Inquiry",
          message: payload.message,
          status: "unread"
        });
      }
      
      // Remove the tag from the final message
      cleanText = cleanText.replace(fullTag, "");
    } catch (e) {
      console.error("Action parse/execute error:", e, payloadStr);
    }
  }
  return cleanText.trim();
}

// ─────────────────────────────────────────────
// TRIGGER DETECTION
// ─────────────────────────────────────────────
function isAdTrigger(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(k => lowerText.includes(k.toLowerCase()));
}

// ─────────────────────────────────────────────
// WHATSAPP SENDERS (With Automated DB Logging)
// ─────────────────────────────────────────────

async function sendTextMessage(to: string, text: string, conversationId?: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("WhatsApp credentials not configured");

  // Log to database if conversationId is provided
  if (conversationId) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: text,
    });
  }

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
  buttons: { id: string; title: string }[],
  conversationId?: string
) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("WhatsApp credentials not configured");

  // Log to database if conversationId is provided
  if (conversationId) {
    const buttonList = buttons.map(b => b.title).join(", ");
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: `${bodyText}\n\n[Buttons: ${buttonList}]`,
    });
  }

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

  console.log(`[AI] Provider Check: Lovable=${!!LOVABLE_API_KEY}, Gemini=${!!GEMINI_API_KEY}`);

  if (LOVABLE_API_KEY) {
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.choices?.[0]?.message?.content;
      } else {
        console.error(`[AI] Lovable API failed: ${resp.status}`, await resp.text());
      }
    } catch (e) { console.error("[AI] Lovable Exception:", e); }
  }

  if (GEMINI_API_KEY) {
    try {
      const geminiContents = [
        { role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS: ${systemPrompt}` }] },
        { role: "model", parts: [{ text: "Understood." }] },
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
      } else {
        console.error(`[AI] Gemini API failed: ${resp.status}`, await resp.text());
      }
    } catch (e) { console.error("[AI] Gemini Exception:", e); }
  }

  return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again soon. 🙏";
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
  const [{ data: history }, { data: progs }, { data: avail }] = await Promise.all([
    supabase.from("messages").select("role, content").eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(15),
    supabase.from("programmes").select("id, title, price, duration, level, type").eq("status", "open"),
    supabase.from("availability").select("day_of_week, start_time, end_time").eq("is_active", true)
  ]);

  const historyMessages = (history || []).map((m: any) => ({ role: m.role, content: m.content }));
  const metadata = conversation.metadata || {};
  const now = new Date();

  const programContext = (progs || []).map((p: any) => `- ${p.title} (${p.level}): ${p.price}, ${p.duration}. ID: ${p.id}`).join("\n");
  const availabilityContext = (avail || []).map((a: any) => `- Day ${a.day_of_week}: ${a.start_time} - ${a.end_time}`).join("\n");

  const nameContext = metadata.captured_name ? `The user's name is ${metadata.captured_name}.` : "";
  const onboardingContext = `ONBOARDING CONTEXT:
Experience: ${metadata.q1_experience || "Unknown"}
Weekly Time: ${metadata.q2_time || "Unknown"}
Goal: ${metadata.q3_goal || "Unknown"}`;

  const actionInstructions = `AVAILABILITY & PROGRAMS:
Available Programs:
${programContext}

Our Weekly Availability (0=Sun, 1=Mon...):
${availabilityContext}
Current Date/Time: ${now.toISOString()} (${now.toLocaleDateString('en-US', { weekday: 'long' })})

TOOLS & ACTIONS:
You have special tools to help the user. Append them at the end of your message in square brackets.
1. [ACTION: CREATE_BOOKING {"first_name": "...", "last_name": "...", "email": "...", "phone": "${from}", "programme_id": "...", "booking_date": "YYYY-MM-DD", "start_time": "HH:MM:SS", "is_online": true}]
   - Use this when a user confirms they want to book a specific program for a specific date/time.
2. [ACTION: SEND_CONTACT {"name": "...", "email": "...", "subject": "...", "message": "..."}]
   - Use this for general inquiries, complaints, or if they want a coach to call them back.

RULES:
- ONLY trigger a booking if you have the User's Name, Email, Choice of Program, and a Date/Time.
- If info is missing, ask for it politely.
- Use the Program IDs provided above.`;

  const finalSystemPrompt = `${config.system_prompt}

${config.agent_name} Identity:
- Tone of Voice: ${config.tone_voice || "Friendly"}
- Response Style: ${config.response_style || "Concise"}

User Context:
${nameContext}
${onboardingContext}

MODE: ${mode === "freeform_qa" ? "Helpful Q&A" : "Post-Onboarding Followup"}

BUSINESS KNOWLEDGE:
${knowledge}

STRUCTURED FAQs:
${(config.faqs || []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}

${actionInstructions}

Always stay in character as ${config.agent_name}.`;

  console.log(`[AI] System Prompt prepared for ${config.agent_name}`);
  const aiRawResponse = await callAIWithFallback(finalSystemPrompt, historyMessages);
  
  console.log(`[AI] Raw Response: ${aiRawResponse}`);

  // Process actions and clean the message
  const aiResponse = await processAIActions(aiRawResponse);
  
  console.log(`[AI] Cleaned Response: ${aiResponse}`);

  // sendTextMessage now handles the database insertion
  await sendTextMessage(from, aiResponse, conversation.id);

  // Periodic lead extraction
  if (historyMessages.filter((m: any) => m.role === "user").length % 3 === 0) {
    const leadPrompt = `${config.lead_qualification_prompt}\nReturn valid JSON.`;
    const leadRaw = await callAIWithFallback(leadPrompt, historyMessages);
    const jsonMatch = leadRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const leadInfo = JSON.parse(jsonMatch[0]);
        await supabase.from("leads").upsert({
          whatsapp_phone: from,
          conversation_id: conversation.id,
          name: metadata.captured_name || conversation.whatsapp_name || leadInfo.name,
          email: leadInfo.email,
          training_interest: leadInfo.training_interest,
          experience_level: metadata.q1_experience || leadInfo.experience_level,
          status: leadInfo.qualification_status,
          lead_score: leadInfo.lead_score,
          notes: leadInfo.qualification_reason,
          extracted_data: leadInfo
        }, { onConflict: "whatsapp_phone" });
      } catch (e) { console.error("Lead parse error:", e); }
    }
  }
}

// ─────────────────────────────────────────────
// MAIN SERVE HANDLER
// ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (url.searchParams.get("hub.verify_token") === verifyToken) {
      return new Response(url.searchParams.get("hub.challenge"), { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log(`[Webhook] Incoming body:`, JSON.stringify(body));

      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message) {
        console.log("[Webhook] No valid message found in payload.");
        return new Response("OK", { status: 200 });
      }

      const from = message.from;
      console.log(`[Webhook] Message from: ${from}`);
      let text = (message.text?.body || "").trim();
      let buttonId = "";

      if (message.type === "interactive") {
        buttonId = message.interactive?.button_reply?.id || "";
        text = message.interactive?.button_reply?.title || "";
      }

      const [{ data: config }, { data: kbData }] = await Promise.all([
        supabase.from("agent_config").select("*").limit(1).single(),
        supabase.from("knowledge_base").select("content").limit(10)
      ]);
      console.log(`[Context] Config: ${config?.agent_name}, KB Entries: ${kbData?.length || 0}`);

      const knowledge = kbData?.map((k: any) => k.content).join("\n\n") || "";
      if (!config) throw new Error("Config not found");

      let { data: conversation } = await supabase.from("conversations").select("*").eq("whatsapp_phone", from).single();
      if (!conversation) {
        const { data: newConv } = await supabase.from("conversations").insert({
          whatsapp_phone: from,
          whatsapp_name: body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name,
          metadata: { onboarding_state: "idle" }
        }).select("*").single();
        conversation = newConv;
      }

      const metadata = conversation.metadata || {};
      let state = metadata.onboarding_state || "idle";
      console.log(`[State] Conversation ID: ${conversation.id}, Current State: ${state}`);

      // Log incoming user message
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        role: "user",
        content: text || buttonId
      });

      const quiz = config.onboarding_quiz || {};
      const menu = config.initial_menu || {};

      // STATE MACHINE
      if (state === "idle") {
        if (isAdTrigger(text, config.ad_trigger_keywords || [])) {
          await sendInteractiveButtons(from, quiz.welcome.body, quiz.welcome.buttons, conversation.id);
          state = "q1_pending";
        } else {
          await sendInteractiveButtons(from, menu.body, menu.buttons, conversation.id);
          state = "choice_pending";
        }
      } else if (state === "choice_pending") {
        if (buttonId === "choice_learn" || isAdTrigger(text, config.ad_trigger_keywords || [])) {
          await sendInteractiveButtons(from, quiz.welcome.body, quiz.welcome.buttons, conversation.id);
          state = "q1_pending";
        } else if (buttonId === "choice_ask") {
          await sendTextMessage(from, "Sure! 💬 Ask me anything about trading.", conversation.id);
          state = "freeform";
        } else {
          await sendInteractiveButtons(from, menu.body, menu.buttons, conversation.id);
        }
      } else if (state === "q1_pending" && buttonId === "start_yes") {
        const q = quiz.questions[0];
        await sendInteractiveButtons(from, q.text, q.options, conversation.id);
        state = "q1_answered";
      } else if (state === "q1_answered") {
        metadata.q1_experience = buttonId || text;
        const q = quiz.questions[1];
        await sendInteractiveButtons(from, q.text, q.options, conversation.id);
        state = "q2_answered";
      } else if (state === "q2_answered") {
        metadata.q2_time = buttonId || text;
        const q = quiz.questions[2];
        await sendInteractiveButtons(from, q.text, q.options, conversation.id);
        state = "q3_answered";
      } else if (state === "q3_answered") {
        metadata.q3_goal = buttonId || text;
        const rec = quiz.recommendation;
        const isIntermediate = rec.intermediate_triggers?.includes(metadata.q1_experience);
        const bodyText = rec.base_text.replace("{program}", isIntermediate ? "Intermediate" : "Beginner");
        await sendInteractiveButtons(from, bodyText, [rec.details_button], conversation.id);
        state = "details_pending";
      } else if (state === "details_pending" && buttonId === "send_details") {
        await sendTextMessage(from, `Details: ${quiz.details.link}`, conversation.id);
        await sendTextMessage(from, quiz.details.message, conversation.id);
        state = "name_pending";
      } else if (state === "name_pending") {
        metadata.captured_name = text;
        await sendTextMessage(from, quiz.handoff.replace("{name}", text), conversation.id);
        state = "name_done";
      } else if (state === "freeform") {
        await handleAIReply(from, conversation, config, knowledge, "freeform_qa");
      } else {
        await handleAIReply(from, conversation, config, knowledge, "post_onboarding");
      }

      metadata.onboarding_state = state;
      console.log(`[State] New State: ${state}`);
      await supabase.from("conversations").update({ metadata }).eq("id", conversation.id);
      return new Response("OK", { status: 200 });
    } catch (e) {
      console.error("Webhook error:", e);
      return new Response("Error", { status: 500 });
    }
  }
  return new Response("Not Found", { status: 404 });
});