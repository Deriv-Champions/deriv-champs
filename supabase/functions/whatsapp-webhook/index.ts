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

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ═══════════════════════════════════════════════════════
// WhatsApp Messaging
// ═══════════════════════════════════════════════════════

function waHeaders() {
  return {
    Authorization: `Bearer ${Deno.env.get("WHATSAPP_ACCESS_TOKEN")}`,
    "Content-Type": "application/json",
  };
}

function waUrl() {
  return `https://graph.facebook.com/v21.0/${Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")}/messages`;
}

async function sendText(to: string, text: string) {
  const r = await fetch(waUrl(), {
    method: "POST",
    headers: waHeaders(),
    body: JSON.stringify({
      messaging_product: "whatsapp", to, type: "text",
      text: { body: text },
    }),
  });
  if (!r.ok) console.error("WA text error:", r.status, await r.text());
}

async function sendButtons(to: string, bodyText: string, buttons: { id: string; title: string }[]) {
  const r = await fetch(waUrl(), {
    method: "POST",
    headers: waHeaders(),
    body: JSON.stringify({
      messaging_product: "whatsapp", to, type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map(b => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    }),
  });
  if (!r.ok) console.error("WA buttons error:", r.status, await r.text());
}

async function sendList(to: string, bodyText: string, btnLabel: string, sections: any[]) {
  const r = await fetch(waUrl(), {
    method: "POST",
    headers: waHeaders(),
    body: JSON.stringify({
      messaging_product: "whatsapp", to, type: "interactive",
      interactive: {
        type: "list",
        body: { text: bodyText },
        action: { button: btnLabel, sections },
      },
    }),
  });
  if (!r.ok) console.error("WA list error:", r.status, await r.text());
}

// ═══════════════════════════════════════════════════════
// Database Fetchers
// ═══════════════════════════════════════════════════════

async function fetchAllContext() {
  const [cfgR, prgR, avlR, kbR] = await Promise.all([
    supabase.from("agent_config").select("*").limit(1).single(),
    supabase.from("programmes").select("*").eq("status", "open"),
    supabase.from("availability").select("*").eq("is_active", true).order("day_of_week"),
    supabase.from("knowledge_base").select("*").eq("is_active", true),
  ]);
  return {
    config: cfgR.data,
    programmes: prgR.data || [],
    availability: avlR.data || [],
    kb: kbR.data || [],
  };
}

function formatProgrammes(p: any[]) {
  if (!p.length) return "No programmes currently available.";
  return p.map(x =>
    `• ${x.title}${x.subtitle ? ` (${x.subtitle})` : ''} — ${x.description || 'N/A'}\n  Level: ${x.level || 'Any'} | Duration: ${x.duration || 'Flexible'} | Price: ${x.price || 'Contact us'} | Spots: ${x.spots_left ?? '?'}/${x.spots ?? '?'}`
  ).join('\n');
}

function formatAvailability(a: any[]) {
  if (!a.length) return "No availability data configured.";
  return a.map(x => `• ${DAYS[x.day_of_week]}: ${x.start_time} – ${x.end_time}`).join('\n');
}

function formatKB(kb: any[]) {
  if (!kb.length) return "No knowledge base entries.";
  return kb.map(x => `[${x.category || 'general'}] ${x.title}:\n${x.content}`).join('\n\n');
}

// ═══════════════════════════════════════════════════════
// AI
// ═══════════════════════════════════════════════════════

async function callAI(systemPrompt: string, msgs: { role: string; content: string }[]): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const full = [{ role: "system", content: systemPrompt }, ...msgs];

  let resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: full }),
  });

  if (!resp.ok) {
    console.error("Primary AI error:", resp.status);
    resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: full }),
    });
    if (!resp.ok) throw new Error(`AI fallback failed [${resp.status}]`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

async function saveMsg(convId: string, role: string, content: string) {
  await supabase.from("messages").insert({ conversation_id: convId, role, content });
}

async function getHistory(convId: string) {
  const { data } = await supabase.from("messages")
    .select("role, content").eq("conversation_id", convId)
    .order("created_at", { ascending: true }).limit(20);
  return (data || []).map(m => ({ role: m.role, content: m.content }));
}

async function setMeta(convId: string, meta: any) {
  await supabase.from("conversations")
    .update({ metadata: meta, updated_at: new Date().toISOString() })
    .eq("id", convId);
}

function ok() {
  return new Response("OK", { status: 200, headers: corsHeaders });
}

// ═══════════════════════════════════════════════════════
// Lead Extraction & Upsert
// ═══════════════════════════════════════════════════════

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
- qualification_reason: A 2-3 sentence explanation of WHY you assigned this stage and score
- key_interests: Array of specific topics they asked about
- objections: Any concerns or hesitations expressed
- next_action: Suggested follow-up action

Return ONLY valid JSON, no other text.`;

async function extractAndUpsertLead(convId: string, phone: string) {
  const msgs = await getHistory(convId);
  if (msgs.length % 3 !== 0 && msgs.length > 2) return;

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: LEAD_QUALIFICATION_PROMPT },
          ...msgs.slice(-10),
        ],
      }),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return;
    const info = JSON.parse(match[0]);

    const lead: Record<string, any> = {
      conversation_id: convId,
      whatsapp_phone: phone,
      extracted_data: info,
    };
    if (info.name) {
      lead.name = info.name;
      await supabase.from("conversations").update({ whatsapp_name: info.name }).eq("id", convId);
    }
    if (info.email) lead.email = info.email;
    if (info.training_interest) lead.training_interest = info.training_interest;
    if (info.experience_level) lead.experience_level = info.experience_level;
    if (typeof info.lead_score === "number") lead.lead_score = info.lead_score;
    if (info.qualification_status &&
        ["new","contacted","nurturing","qualified","proposal","negotiation","converted","lost"].includes(info.qualification_status)) {
      lead.status = info.qualification_status;
    }
    const notes: string[] = [];
    if (info.qualification_reason) notes.push(`AI: ${info.qualification_reason}`);
    if (info.next_action) notes.push(`Next: ${info.next_action}`);
    if (info.objections) notes.push(`Objections: ${info.objections}`);
    if (info.key_interests?.length) notes.push(`Interests: ${info.key_interests.join(", ")}`);
    if (notes.length) lead.notes = notes.join(" | ");

    await supabase.from("leads").upsert(lead, { onConflict: "whatsapp_phone" });
  } catch (e) {
    console.error("Lead extraction error:", e);
  }
}

// ═══════════════════════════════════════════════════════
// Flow Handlers
// ═══════════════════════════════════════════════════════

async function showMainMenu(to: string, convId: string) {
  await sendButtons(to, "Welcome to Deriv Champions! 🏆\n\nHow can I help you today?", [
    { id: "btn_learn", title: "I Want to Learn" },
    { id: "btn_ask", title: "Ask a Question" },
    { id: "btn_task", title: "Complete a Task" },
  ]);
  await saveMsg(convId, "assistant", "[Main Menu] I Want to Learn | Ask a Question | Complete a Task");
  await setMeta(convId, { flow: null });
}

async function handleAIFlow(to: string, convId: string, ctx: any, flowType: string) {
  const history = await getHistory(convId);
  const agentName = ctx.config?.agent_name || "Trading Assistant";
  const basePrompt = ctx.config?.system_prompt || "You are a helpful trading assistant.";
  const toneVoice = ctx.config?.tone_voice || "Warm, encouraging, and professional.";
  const responseStyle = ctx.config?.response_style || "Concise, conversational, and helpful.";

  let contextData = "";

  if (flowType === "onboarding") {
    const quiz = ctx.config?.onboarding_quiz ? JSON.stringify(ctx.config.onboarding_quiz, null, 2) : "{}";
    const faqs = ctx.config?.faqs ? JSON.stringify(ctx.config.faqs, null, 2) : "[]";
    contextData = `
MODE: ONBOARDING
You are guiding the user through the onboarding quiz. Follow the quiz structure below exactly.
Ask one question at a time. Be warm and encouraging.

ONBOARDING QUIZ STRUCTURE:
${quiz}

FAQs:
${faqs}

AVAILABLE PROGRAMMES:
${formatProgrammes(ctx.programmes)}

AVAILABILITY:
${formatAvailability(ctx.availability)}

KNOWLEDGE BASE:
${formatKB(ctx.kb)}

After completing the quiz, summarize what you learned and suggest the best programme.
Remind the user they can type "menu" to see all options.`;

  } else if (flowType === "qa_general") {
    contextData = `
MODE: GENERAL Q&A
Answer the user's question using ALL data below. Be accurate and reference specific details.

AVAILABLE PROGRAMMES:
${formatProgrammes(ctx.programmes)}

AVAILABILITY:
${formatAvailability(ctx.availability)}

KNOWLEDGE BASE:
${formatKB(ctx.kb)}

FAQs:
${ctx.config?.faqs ? JSON.stringify(ctx.config.faqs, null, 2) : "[]"}

Keep answers concise and accurate. Only share information that exists in the data above.
After answering, remind them they can type "menu" for more options.`;

  } else if (flowType === "qa_programs") {
    contextData = `
MODE: PROGRAMMES Q&A
Answer questions about training programmes using the data below. Be specific with prices, durations, levels, and spots.

AVAILABLE PROGRAMMES:
${formatProgrammes(ctx.programmes)}

Only share programme information from the data above. Do not make up details.
After answering, remind them they can type "menu" for more options or book a session.`;

  } else if (flowType === "qa_availability") {
    contextData = `
MODE: AVAILABILITY Q&A
Answer questions about scheduling and availability using the data below.

AVAILABILITY:
${formatAvailability(ctx.availability)}

Only share availability from the data above. Do not guess or make up times.
After answering, remind them they can type "menu" for more options or book a session.`;
  }

  const systemPrompt = `${basePrompt}

Your name is ${agentName}.
Tone: ${toneVoice}
Style: ${responseStyle}

IMPORTANT: Your FIRST interaction with a new user MUST ask for their name in a warm, friendly way. Once they share it, use it throughout.

${contextData}`;

  const aiResponse = await callAI(systemPrompt, history);
  await saveMsg(convId, "assistant", aiResponse);
  await sendText(to, aiResponse);
}

// ─── Booking Flow ───────────────────────────────────

async function handleBookingStep(to: string, convId: string, meta: any, userInput: string, ctx: any) {
  const step = meta.booking_step;
  const data = meta.booking_data || {};

  switch (step) {
    case "first_name":
      data.first_name = userInput;
      await setMeta(convId, { flow: "booking", booking_step: "last_name", booking_data: data });
      await sendText(to, `Thanks ${data.first_name}! 😊\n\nWhat's your *last name*?`);
      await saveMsg(convId, "assistant", `Got first name: ${data.first_name}. Asked for last name.`);
      break;

    case "last_name":
      data.last_name = userInput;
      await setMeta(convId, { flow: "booking", booking_step: "email", booking_data: data });
      await sendText(to, "What's your *email address*? 📧\n(We'll send your booking confirmation here)");
      await saveMsg(convId, "assistant", "Got last name. Asked for email.");
      break;

    case "email":
      data.email = userInput;
      if (ctx.programmes.length > 0) {
        const sections = [{
          title: "Our Programmes",
          rows: ctx.programmes.slice(0, 10).map((p: any) => ({
            id: `prog_${p.id}`,
            title: (p.title || "Programme").slice(0, 24),
            description: `${p.price || 'Contact us'} - ${p.duration || 'Flexible'}`.slice(0, 72),
          })),
        }];
        await setMeta(convId, { flow: "booking", booking_step: "programme", booking_data: data });
        await sendList(to, "Which programme would you like to book?", "View Programmes", sections);
        await saveMsg(convId, "assistant", "Got email. Showed programme list.");
      } else {
        await setMeta(convId, { flow: "booking", booking_step: "format", booking_data: data });
        await sendButtons(to, "Would you prefer online or in-person training?", [
          { id: "format_online", title: "Online" },
          { id: "format_inperson", title: "In-Person" },
        ]);
        await saveMsg(convId, "assistant", "No programmes. Asked for format.");
      }
      break;

    case "programme": {
      const progId = userInput.startsWith("prog_") ? userInput.replace("prog_", "") : null;
      let prog = progId ? ctx.programmes.find((p: any) => p.id === progId) : null;
      if (!prog) {
        prog = ctx.programmes.find((p: any) =>
          p.title.toLowerCase().includes(userInput.toLowerCase())
        );
      }
      data.programme_id = prog?.id || null;
      data.programme_name = prog?.title || userInput;
      await setMeta(convId, { flow: "booking", booking_step: "format", booking_data: data });
      await sendButtons(to, `Great choice — *${data.programme_name}*! 🎯\n\nOnline or in-person?`, [
        { id: "format_online", title: "Online" },
        { id: "format_inperson", title: "In-Person" },
      ]);
      await saveMsg(convId, "assistant", `Selected: ${data.programme_name}. Asked for format.`);
      break;
    }

    case "format":
      data.is_online = userInput.toLowerCase().includes("online") || userInput === "format_online";
      await setMeta(convId, { flow: "booking", booking_step: "message", booking_data: data });
      await sendText(to, "Any additional message or goals? 📝\n\n(Type *skip* to skip)");
      await saveMsg(convId, "assistant", `Format: ${data.is_online ? 'Online' : 'In-Person'}. Asked for message.`);
      break;

    case "message":
      data.message = userInput.toLowerCase() === "skip" ? null : userInput;
      await setMeta(convId, { flow: "booking", booking_step: "confirm", booking_data: data });

      const summary = `📋 *Booking Summary*\n\n` +
        `👤 *Name:* ${data.first_name} ${data.last_name}\n` +
        `📧 *Email:* ${data.email}\n` +
        `📚 *Programme:* ${data.programme_name || 'General'}\n` +
        `💻 *Format:* ${data.is_online ? 'Online' : 'In-Person'}` +
        (data.message ? `\n💬 *Message:* ${data.message}` : '') +
        `\n\nIs everything correct?`;

      await sendButtons(to, summary, [
        { id: "booking_confirm", title: "Confirm Booking" },
        { id: "booking_cancel", title: "Cancel" },
      ]);
      await saveMsg(convId, "assistant", "Showed booking summary.");
      break;

    case "confirm":
      if (userInput === "booking_cancel" || userInput.toLowerCase().includes("cancel")) {
        await setMeta(convId, { flow: null });
        await sendText(to, "Booking cancelled. No worries! 😊");
        await showMainMenu(to, convId);
      } else {
        const { data: booking, error } = await supabase.from("bookings").insert({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: to,
          email: data.email,
          programme_id: data.programme_id || null,
          is_online: data.is_online,
          message: data.message,
          status: "pending",
        }).select("id").single();

        if (error) {
          console.error("Booking insert error:", error);
          await sendText(to, "Sorry, there was an error. Please try again later. 😔");
        } else {
          const bookingId = booking?.id?.slice(0, 8).toUpperCase() || "N/A";
          await sendBookingEmail(data.email, data, bookingId);
          await sendText(to,
            `🎉 *Booking Confirmed!*\n\n` +
            `📋 *Booking ID:* #${bookingId}\n` +
            `✉️ Confirmation sent to ${data.email}\n\n` +
            `Is there anything else I can help you with?`
          );
          await saveMsg(convId, "assistant", `Booking confirmed! ID: ${bookingId}`);
        }
        await setMeta(convId, { flow: null });
      }
      break;

    default:
      await showMainMenu(to, convId);
  }
}

// ─── Contact Flow ───────────────────────────────────

async function handleContactStep(to: string, convId: string, meta: any, userInput: string) {
  const step = meta.contact_step;
  const data = meta.contact_data || {};

  switch (step) {
    case "name":
      data.name = userInput;
      await setMeta(convId, { flow: "contact", contact_step: "email", contact_data: data });
      await sendText(to, "What's your *email address*? 📧\n(Type *skip* to skip)");
      await saveMsg(convId, "assistant", "Got name. Asked for email.");
      break;

    case "email":
      data.email = userInput.toLowerCase() === "skip" ? null : userInput;
      await setMeta(convId, { flow: "contact", contact_step: "subject", contact_data: data });
      await sendText(to, "What's the *subject* of your message?");
      await saveMsg(convId, "assistant", "Got email. Asked for subject.");
      break;

    case "subject":
      data.subject = userInput;
      await setMeta(convId, { flow: "contact", contact_step: "message", contact_data: data });
      await sendText(to, "Go ahead and type your *message*: 💬");
      await saveMsg(convId, "assistant", "Got subject. Asked for message.");
      break;

    case "message":
      const { error } = await supabase.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: userInput,
      });

      if (error) {
        console.error("Contact insert error:", error);
        await sendText(to, "Sorry, there was an error. Please try again. 😔");
      } else {
        await sendText(to, "✅ *Message sent!*\n\nOur team will get back to you soon.\n\nAnything else I can help with?");
        await saveMsg(convId, "assistant", "Contact message saved.");
      }
      await setMeta(convId, { flow: null });
      break;

    default:
      await showMainMenu(to, convId);
  }
}

// ─── Booking Email ──────────────────────────────────

async function sendBookingEmail(email: string, data: any, bookingId: string) {
  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const sender = Deno.env.get("RESEND_SENDER_EMAIL");
    if (!apiKey || !sender) { console.log("Resend not configured, skipping email"); return; }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: email,
        subject: `Booking Confirmation - #${bookingId}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#f97316">🎉 Booking Confirmed!</h2>
          <p>Hi ${data.first_name},</p>
          <p>Your training session has been booked successfully.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Booking ID</strong></td><td style="padding:8px;border-bottom:1px solid #eee">#${bookingId}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Programme</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${data.programme_name || 'General'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Format</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${data.is_online ? 'Online' : 'In-Person'}</td></tr>
          </table>
          <p>We'll be in touch with more details soon.</p>
          <p>Best regards,<br><strong>Deriv Champions</strong></p>
        </div>`,
      }),
    });
  } catch (e) {
    console.error("Email error:", e);
  }
}

// ═══════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === Deno.env.get("WHATSAPP_VERIFY_TOKEN")) {
      console.log("Webhook verified");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const entry = body?.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];

    if (!message) return ok();

    const from = message.from;
    const contactName = entry?.contacts?.[0]?.profile?.name || null;

    // Parse user input — text, button reply, or list reply
    let userText = "";
    let buttonId = "";

    if (message.type === "text") {
      userText = message.text.body;
    } else if (message.type === "interactive") {
      const inter = message.interactive;
      if (inter.type === "button_reply") {
        buttonId = inter.button_reply.id;
        userText = inter.button_reply.title;
      } else if (inter.type === "list_reply") {
        buttonId = inter.list_reply.id;
        userText = inter.list_reply.title;
      }
    }

    if (!userText && !buttonId) return ok();

    // Get or create conversation
    let { data: conv } = await supabase
      .from("conversations")
      .select("id, metadata")
      .eq("whatsapp_phone", from)
      .single();

    if (!conv) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ whatsapp_phone: from, whatsapp_name: contactName })
        .select("id, metadata")
        .single();
      conv = newConv;
    } else if (contactName) {
      await supabase
        .from("conversations")
        .update({ whatsapp_name: contactName, updated_at: new Date().toISOString() })
        .eq("id", conv.id);
    }

    if (!conv) {
      console.error("Failed to get/create conversation");
      return new Response("Error", { status: 500, headers: corsHeaders });
    }

    // Save user message
    await saveMsg(conv.id, "user", userText || buttonId);

    // Fetch all context in parallel
    const ctx = await fetchAllContext();
    const meta = (conv.metadata as any) || {};
    const flow = meta.flow || null;
    const lowerText = (userText || "").toLowerCase().trim();

    // ─── Global Triggers ─────────────────────────────

    // "menu" / "back" always resets to main menu
    if (lowerText === "menu" || lowerText === "back" || lowerText === "home") {
      await showMainMenu(from, conv.id);
      return ok();
    }

    // "I want to learn" trigger — works from any state
    const triggers = ctx.config?.ad_trigger_keywords || [];
    const isLearnTrigger =
      triggers.some((kw: string) => lowerText.includes(kw.toLowerCase())) ||
      lowerText.includes("i want to learn");

    if (isLearnTrigger) {
      await setMeta(conv.id, { flow: "onboarding" });
      await handleAIFlow(from, conv.id, ctx, "onboarding");
      await extractAndUpsertLead(conv.id, from);
      return ok();
    }

    // ─── Button Handlers ─────────────────────────────

    if (buttonId === "btn_learn") {
      await setMeta(conv.id, { flow: "onboarding" });
      await handleAIFlow(from, conv.id, ctx, "onboarding");
      return ok();
    }

    if (buttonId === "btn_ask") {
      await sendButtons(from, "What would you like to know about? 🤔", [
        { id: "cat_general", title: "General" },
        { id: "cat_programs", title: "Programs" },
        { id: "cat_availability", title: "Availability" },
      ]);
      await saveMsg(conv.id, "assistant", "[Categories] General | Programs | Availability");
      return ok();
    }

    if (buttonId === "btn_task") {
      await sendButtons(from, "What would you like to do? ✅", [
        { id: "task_book", title: "Book Training" },
        { id: "task_message", title: "Send Message" },
      ]);
      await saveMsg(conv.id, "assistant", "[Tasks] Book Training | Send Message");
      return ok();
    }

    // Category buttons
    if (buttonId === "cat_general") {
      await setMeta(conv.id, { flow: "qa_general" });
      await sendText(from, "Ask me anything about Deriv Champions! 💡\n\nI have info about our programs, availability, and trading topics.\n\nType your question:");
      await saveMsg(conv.id, "assistant", "Ready for general questions.");
      return ok();
    }

    if (buttonId === "cat_programs") {
      await setMeta(conv.id, { flow: "qa_programs" });
      const progList = ctx.programmes.map((p: any) =>
        `• *${p.title}* — ${p.price || 'Contact us'} (${p.duration || 'Flexible'})`
      ).join("\n");
      await sendText(from, `Here are our programmes:\n\n${progList || 'No programmes currently available.'}\n\nWhat would you like to know?`);
      await saveMsg(conv.id, "assistant", "Shared programmes. Waiting for question.");
      return ok();
    }

    if (buttonId === "cat_availability") {
      await setMeta(conv.id, { flow: "qa_availability" });
      const availList = ctx.availability.map((a: any) =>
        `• *${DAYS[a.day_of_week]}*: ${a.start_time} – ${a.end_time}`
      ).join("\n");
      await sendText(from, `Here's our schedule:\n\n${availList || 'No availability set.'}\n\nAny questions about scheduling?`);
      await saveMsg(conv.id, "assistant", "Shared availability. Waiting for question.");
      return ok();
    }

    // Task buttons
    if (buttonId === "task_book") {
      await setMeta(conv.id, { flow: "booking", booking_step: "first_name", booking_data: {} });
      await sendText(from, "Let's book your training! 📅\n\nWhat's your *first name*?");
      await saveMsg(conv.id, "assistant", "Booking flow started. Asked for first name.");
      return ok();
    }

    if (buttonId === "task_message") {
      await setMeta(conv.id, { flow: "contact", contact_step: "name", contact_data: {} });
      await sendText(from, "I'll pass your message along! 💬\n\nWhat's your *name*?");
      await saveMsg(conv.id, "assistant", "Contact flow started. Asked for name.");
      return ok();
    }

    // Booking-specific buttons
    if ((buttonId === "format_online" || buttonId === "format_inperson") && flow === "booking") {
      await handleBookingStep(from, conv.id, meta, buttonId, ctx);
      return ok();
    }

    if ((buttonId === "booking_confirm" || buttonId === "booking_cancel") && flow === "booking") {
      await handleBookingStep(from, conv.id, meta, buttonId, ctx);
      return ok();
    }

    if (buttonId.startsWith("prog_") && flow === "booking") {
      await handleBookingStep(from, conv.id, meta, buttonId, ctx);
      return ok();
    }

    // ─── Active Flow Handlers ────────────────────────

    if (flow === "onboarding") {
      await handleAIFlow(from, conv.id, ctx, "onboarding");
      await extractAndUpsertLead(conv.id, from);
      return ok();
    }

    if (flow === "qa_general" || flow === "qa_programs" || flow === "qa_availability") {
      await handleAIFlow(from, conv.id, ctx, flow);
      await extractAndUpsertLead(conv.id, from);
      return ok();
    }

    if (flow === "booking") {
      await handleBookingStep(from, conv.id, meta, userText, ctx);
      return ok();
    }

    if (flow === "contact") {
      await handleContactStep(from, conv.id, meta, userText);
      return ok();
    }

    // ─── Default: Show Main Menu ─────────────────────
    await showMainMenu(from, conv.id);
    await extractAndUpsertLead(conv.id, from);
    return ok();

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
