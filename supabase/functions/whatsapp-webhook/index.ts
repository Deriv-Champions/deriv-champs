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
// WHATSAPP MESSAGE SENDERS
// ─────────────────────────────────────────────

async function sendText(to: string, text: string, convId?: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("WhatsApp credentials missing");

  if (convId) {
    await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: text });
  }

  const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  if (!resp.ok) console.error("[WA] Text send error:", resp.status, await resp.text());
}

// WhatsApp button rules: max 3 buttons, title max 20 chars, id max 256 chars
function sanitizeButtons(buttons: { id: string; title: string }[]): { id: string; title: string }[] {
  return buttons.slice(0, 3).map(b => ({
    id: (b.id || "btn").substring(0, 256),
    title: (b.title || "Option").substring(0, 20),
  }));
}

async function sendButtons(to: string, bodyText: string, buttons: { id: string; title: string }[], convId?: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) throw new Error("WhatsApp credentials missing");

  const safeButtons = sanitizeButtons(buttons);
  // Body text max 1024 chars for WhatsApp
  const safeBody = bodyText.substring(0, 1024);

  if (convId) {
    const btnList = safeButtons.map(b => b.title).join(", ");
    await supabase.from("messages").insert({ conversation_id: convId, role: "assistant", content: `${safeBody}\n\n[Buttons: ${btnList}]` });
  }

  const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: safeBody },
        action: {
          buttons: safeButtons.map(b => ({ type: "reply", reply: { id: b.id, title: b.title } })),
        },
      },
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error("[WA] Button send error:", resp.status, errText);
    // Fallback: send as plain text if buttons fail
    await sendText(to, `${safeBody}\n\nOptions: ${safeButtons.map(b => `• ${b.title}`).join("\n")}`, undefined);
  }
}

// ─────────────────────────────────────────────
// AI PROVIDER LAYER
// ─────────────────────────────────────────────

async function callAI(systemPrompt: string, messages: { role: string; content: string }[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

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
        return data.choices?.[0]?.message?.content || "";
      }
      console.error(`[AI] Lovable failed: ${resp.status}`, await resp.text());
    } catch (e) { console.error("[AI] Lovable error:", e); }
  }

  if (GEMINI_API_KEY) {
    try {
      const contents = [
        { role: "user", parts: [{ text: `SYSTEM: ${systemPrompt}` }] },
        { role: "model", parts: [{ text: "Understood." }] },
        ...messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
      ];
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
      console.error(`[AI] Gemini failed: ${resp.status}`, await resp.text());
    } catch (e) { console.error("[AI] Gemini error:", e); }
  }

  return "I'm having trouble right now. Please try again soon. 🙏";
}

// ─────────────────────────────────────────────
// ACTION PROCESSING (Booking & Contact from AI)
// ─────────────────────────────────────────────

async function processActions(text: string): Promise<string> {
  let clean = text;
  const regex = /\[ACTION:\s*(\w+)\s*(\{[\s\S]*?\})\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [fullTag, action, jsonStr] = match;
    try {
      const p = JSON.parse(jsonStr);
      if (action === "CREATE_BOOKING") {
        await supabase.from("bookings").insert({
          first_name: p.first_name, last_name: p.last_name || "",
          email: p.email, phone: p.phone, programme_id: p.programme_id,
          booking_date: p.booking_date, start_time: p.start_time,
          is_online: p.is_online ?? true, message: p.message || "Booked via AI", status: "pending"
        });
      } else if (action === "SEND_CONTACT") {
        await supabase.from("contact_messages").insert({
          name: p.name, email: p.email, subject: p.subject || "WhatsApp Inquiry",
          message: p.message, status: "unread"
        });
      }
      clean = clean.replace(fullTag, "");
    } catch (e) { console.error("Action error:", e); }
  }
  return clean.trim();
}

// ─────────────────────────────────────────────
// CONTEXT FETCHERS
// ─────────────────────────────────────────────

async function fetchContext() {
  const [{ data: progs }, { data: avail }, { data: kb }] = await Promise.all([
    supabase.from("programmes").select("id, title, price, duration, level, type, description").eq("status", "open"),
    supabase.from("availability").select("day_of_week, start_time, end_time").eq("is_active", true),
    supabase.from("knowledge_base").select("title, content, category").eq("is_active", true).limit(20),
  ]);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const programCtx = (progs || []).map(p => `- ${p.title} (${p.level}): ${p.price}, ${p.duration}. Type: ${p.type}. ${p.description || ""}. ID: ${p.id}`).join("\n");
  const availCtx = (avail || []).map(a => `- ${days[a.day_of_week]}: ${a.start_time} - ${a.end_time}`).join("\n");
  const kbCtx = (kb || []).map(k => `[${k.category}] ${k.title}: ${k.content}`).join("\n\n");

  return { programCtx, availCtx, kbCtx, programs: progs || [], availability: avail || [] };
}

// ─────────────────────────────────────────────
// AI Q&A HANDLER (with proper context)
// ─────────────────────────────────────────────

async function handleAIQuestion(
  from: string,
  conversation: any,
  config: any,
  category: "general" | "programs" | "availability",
  ctx: Awaited<ReturnType<typeof fetchContext>>
) {
  const { data: history } = await supabase.from("messages").select("role, content")
    .eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(20);

  const historyMsgs = (history || []).map((m: any) => ({ role: m.role, content: m.content }));
  const meta = conversation.metadata || {};
  const nameCtx = meta.captured_name ? `The user's name is ${meta.captured_name}.` : "";
  const now = new Date();

  let focusCtx = "";
  if (category === "programs") {
    focusCtx = `FOCUS: Answer questions about training programs ONLY using this data:\n${ctx.programCtx}\n\nDo NOT make up programs or prices. If a program isn't listed, say it's not currently available.`;
  } else if (category === "availability") {
    focusCtx = `FOCUS: Answer questions about scheduling and availability ONLY using this data:\n${ctx.availCtx}\nCurrent: ${now.toISOString()} (${now.toLocaleDateString('en-US', { weekday: 'long' })})\n\nDo NOT make up times. Only reference what's listed above.`;
  } else {
    focusCtx = `FOCUS: General Q&A. Use ALL available knowledge:\n\nPROGRAMS:\n${ctx.programCtx}\n\nAVAILABILITY:\n${ctx.availCtx}\n\nKNOWLEDGE BASE:\n${ctx.kbCtx}`;
  }

  const faqs = (config.faqs || []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

  const systemPrompt = `${config.system_prompt}

You are ${config.agent_name}.
Tone: ${config.tone_voice || "Friendly"}
Style: ${config.response_style || "Concise"}

${nameCtx}

${focusCtx}

FAQs:
${faqs}

BOOKING TOOLS (append at end of message if needed):
[ACTION: CREATE_BOOKING {"first_name":"...","last_name":"...","email":"...","phone":"${from}","programme_id":"...","booking_date":"YYYY-MM-DD","start_time":"HH:MM:SS","is_online":true}]
[ACTION: SEND_CONTACT {"name":"...","email":"...","subject":"...","message":"..."}]

CRITICAL RULES:
- You have ALREADY introduced yourself. Do NOT say "Hi there, I'm Alexa" or re-introduce yourself.
- Answer the user's question directly and concisely.
- If you don't have the answer in your data, say so honestly.
- Keep responses under 300 words.
- Ask at most ONE follow-up question.`;

  const aiRaw = await callAI(systemPrompt, historyMsgs);
  const aiClean = await processActions(aiRaw);
  await sendText(from, aiClean, conversation.id);

  // Background lead extraction every 3 user messages
  const userMsgCount = historyMsgs.filter((m: any) => m.role === "user").length;
  if (userMsgCount > 0 && userMsgCount % 3 === 0) {
    extractLead(from, conversation, config, historyMsgs);
  }
}

// ─────────────────────────────────────────────
// LEAD EXTRACTION (background, non-blocking)
// ─────────────────────────────────────────────

async function extractLead(from: string, conversation: any, config: any, history: any[]) {
  try {
    const meta = conversation.metadata || {};
    const prompt = `${config.lead_qualification_prompt || "Analyze and extract lead data."}\nReturn ONLY valid JSON with keys: name, email, training_interest, experience_level, qualification_status (new/contacted/qualified/converted/lost), lead_score (0-100), qualification_reason.`;
    const raw = await callAI(prompt, history);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const lead = JSON.parse(jsonMatch[0]);
      await supabase.from("leads").upsert({
        whatsapp_phone: from,
        conversation_id: conversation.id,
        name: meta.captured_name || conversation.whatsapp_name || lead.name,
        email: lead.email,
        training_interest: lead.training_interest,
        experience_level: meta.q1_experience || lead.experience_level,
        status: lead.qualification_status || "new",
        lead_score: lead.lead_score || 0,
        notes: lead.qualification_reason,
        extracted_data: lead,
      }, { onConflict: "whatsapp_phone" });
    }
  } catch (e) { console.error("Lead extraction error:", e); }
}

// ─────────────────────────────────────────────
// BOOKING FLOW (step-by-step)
// ─────────────────────────────────────────────

async function handleBookingStep(
  from: string, convId: string, meta: any, text: string,
  ctx: Awaited<ReturnType<typeof fetchContext>>
): Promise<any> {
  const step = meta.booking_step || "name";

  if (step === "name") {
    meta.booking_name = text;
    meta.booking_step = "email";
    await sendText(from, `Thanks ${text}! 📧 What's your email address?`, convId);
  } else if (step === "email") {
    meta.booking_email = text;
    meta.booking_step = "program";
    // Show available programs as buttons (max 3)
    const progButtons = ctx.programs.slice(0, 3).map(p => ({
      id: `prog_${p.id.substring(0, 20)}`,
      title: (p.title || "Program").substring(0, 20),
    }));
    if (progButtons.length > 0) {
      await sendButtons(from, "Which program would you like to book? 📚", progButtons, convId);
    } else {
      await sendText(from, "No programs are currently available. Please try again later.", convId);
      meta.flow = undefined;
      meta.booking_step = undefined;
    }
  } else if (step === "program") {
    // Extract program ID from button press
    const progId = text.startsWith("prog_") ? text.replace("prog_", "") : text;
    // Find matching program
    const matched = ctx.programs.find(p => p.id.startsWith(progId) || p.title.toLowerCase().includes(text.toLowerCase()));
    if (matched) {
      meta.booking_programme_id = matched.id;
      meta.booking_programme_name = matched.title;
      meta.booking_step = "format";
      await sendButtons(from, `Great choice: *${matched.title}*! 🎯\n\nWould you prefer online or in-person?`, [
        { id: "fmt_online", title: "Online 💻" },
        { id: "fmt_inperson", title: "In-Person 🏢" },
      ], convId);
    } else {
      await sendText(from, "I couldn't find that program. Please select from the options above or type the program name.", convId);
    }
  } else if (step === "format") {
    meta.booking_is_online = text.includes("online") || text.includes("fmt_online");
    meta.booking_step = "confirm";
    
    const summary = `📋 *Booking Summary:*\n\n👤 Name: ${meta.booking_name}\n📧 Email: ${meta.booking_email}\n📚 Program: ${meta.booking_programme_name}\n💻 Format: ${meta.booking_is_online ? "Online" : "In-Person"}\n\nShall I confirm this booking?`;
    await sendButtons(from, summary, [
      { id: "book_confirm", title: "Confirm ✅" },
      { id: "book_cancel", title: "Cancel ❌" },
    ], convId);
  } else if (step === "confirm") {
    if (text.includes("confirm") || text.includes("book_confirm")) {
      // Split name into first/last
      const nameParts = (meta.booking_name || "User").split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";
      
      const { data: booking, error } = await supabase.from("bookings").insert({
        first_name: firstName,
        last_name: lastName,
        email: meta.booking_email,
        phone: from,
        programme_id: meta.booking_programme_id,
        booking_date: new Date().toISOString().split("T")[0],
        is_online: meta.booking_is_online,
        message: `Booked via WhatsApp for ${meta.booking_programme_name}`,
        status: "pending",
      }).select("id").single();

      if (error) {
        console.error("Booking insert error:", error);
        await sendText(from, "Sorry, there was an error creating your booking. Please try again. 🙏", convId);
      } else {
        const bookingId = booking?.id?.substring(0, 8) || "N/A";
        await sendText(from, `🎉 *Booking Confirmed!*\n\n📋 Booking ID: *${bookingId}*\n📚 Program: ${meta.booking_programme_name}\n💻 Format: ${meta.booking_is_online ? "Online" : "In-Person"}\n\nA confirmation has been sent to ${meta.booking_email}. One of our coaches will reach out to you shortly!\n\nIs there anything else I can help you with? 😊`, convId);
      }
      // Reset booking flow
      meta.flow = undefined;
      meta.booking_step = undefined;
    } else {
      await sendText(from, "Booking cancelled. No worries! 😊 Is there anything else I can help with?", convId);
      meta.flow = undefined;
      meta.booking_step = undefined;
    }
  }
  return meta;
}

// ─────────────────────────────────────────────
// CONTACT MESSAGE FLOW
// ─────────────────────────────────────────────

async function handleContactStep(from: string, convId: string, meta: any, text: string): Promise<any> {
  const step = meta.contact_step || "name";

  if (step === "name") {
    meta.contact_name = text;
    meta.contact_step = "message";
    await sendText(from, `Thanks ${text}! 📝 What message would you like to send to our team?`, convId);
  } else if (step === "message") {
    // Save the contact message
    await supabase.from("contact_messages").insert({
      name: meta.contact_name,
      email: null,
      subject: "WhatsApp Message",
      message: text,
      status: "unread",
    });
    await sendText(from, `✅ Your message has been sent to our team! They'll get back to you soon.\n\nIs there anything else I can help with? 😊`, convId);
    meta.flow = undefined;
    meta.contact_step = undefined;
  }
  return meta;
}

// ─────────────────────────────────────────────
// TRIGGER DETECTION
// ─────────────────────────────────────────────

function isLearnTrigger(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);

  // Webhook verification
  if (req.method === "GET") {
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (url.searchParams.get("hub.verify_token") === verifyToken) {
      return new Response(url.searchParams.get("hub.challenge"), { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Not Found", { status: 404 });

  try {
    const body = await req.json();
    console.log("[Webhook] Payload received");

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return new Response("OK", { status: 200 });

    const from = message.from;
    let text = (message.text?.body || "").trim();
    let buttonId = "";

    if (message.type === "interactive") {
      buttonId = message.interactive?.button_reply?.id || "";
      text = message.interactive?.button_reply?.title || buttonId;
    }

    console.log(`[Webhook] From: ${from}, Text: "${text}", ButtonId: "${buttonId}"`);

    // Fetch config and context in parallel
    const [{ data: config }, ctx] = await Promise.all([
      supabase.from("agent_config").select("*").limit(1).single(),
      fetchContext(),
    ]);

    if (!config) throw new Error("Agent config not found");

    // Get or create conversation
    let { data: conversation } = await supabase.from("conversations").select("*").eq("whatsapp_phone", from).single();
    if (!conversation) {
      const { data: newConv } = await supabase.from("conversations").insert({
        whatsapp_phone: from,
        whatsapp_name: body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name,
        metadata: { onboarding_state: "idle" },
      }).select("*").single();
      conversation = newConv;
    }

    const meta = conversation.metadata || {};
    let state = meta.onboarding_state || "idle";
    const inputId = buttonId || text; // Use buttonId if available, else text
    
    console.log(`[State] Conv: ${conversation.id}, State: ${state}, Flow: ${meta.flow || "none"}`);

    // Log incoming user message
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: text || buttonId,
    });

    const quiz = config.onboarding_quiz || {};

    // ── ACTIVE FLOW HANDLING (booking, contact) ──
    if (meta.flow === "booking") {
      const updatedMeta = await handleBookingStep(from, conversation.id, meta, inputId, ctx);
      Object.assign(meta, updatedMeta);
    }
    else if (meta.flow === "contact") {
      const updatedMeta = await handleContactStep(from, conversation.id, meta, text);
      Object.assign(meta, updatedMeta);
    }
    // ── MAIN STATE MACHINE ──
    else if (state === "idle") {
      if (isLearnTrigger(text, config.ad_trigger_keywords || [])) {
        // Trigger → start onboarding
        if (quiz.welcome) {
          await sendButtons(from, quiz.welcome.body, quiz.welcome.buttons, conversation.id);
          state = "q1_pending";
        }
      } else {
        // Non-trigger → show main menu with 3 options
        await sendButtons(from,
          `Hey! 👋 Welcome to *Deriv Champions*!\n\nI'm *${config.agent_name.split(" - ")[0]}*, your trading guide. How can I help you today?`,
          [
            { id: "choice_learn", title: "I Want to Learn 📚" },
            { id: "choice_ask", title: "Ask a Question 💬" },
            { id: "choice_task", title: "Complete a Task ✅" },
          ],
          conversation.id
        );
        state = "menu_pending";
      }
    }
    else if (state === "menu_pending") {
      if (inputId === "choice_learn" || isLearnTrigger(text, config.ad_trigger_keywords || [])) {
        if (quiz.welcome) {
          await sendButtons(from, quiz.welcome.body, quiz.welcome.buttons, conversation.id);
          state = "q1_pending";
        }
      } else if (inputId === "choice_ask") {
        await sendButtons(from,
          "What would you like to know about? 🤔",
          [
            { id: "cat_general", title: "General Info ℹ️" },
            { id: "cat_programs", title: "Programs 📚" },
            { id: "cat_avail", title: "Availability 📅" },
          ],
          conversation.id
        );
        state = "ask_category";
      } else if (inputId === "choice_task") {
        await sendButtons(from,
          "What would you like to do? ✅",
          [
            { id: "task_book", title: "Book Training 📅" },
            { id: "task_message", title: "Send a Message 💬" },
          ],
          conversation.id
        );
        state = "task_pending";
      } else {
        // Unknown input → show menu again
        await sendButtons(from,
          "Please select an option below 👇",
          [
            { id: "choice_learn", title: "I Want to Learn 📚" },
            { id: "choice_ask", title: "Ask a Question 💬" },
            { id: "choice_task", title: "Complete a Task ✅" },
          ],
          conversation.id
        );
      }
    }
    // ── ASK CATEGORY SELECTION ──
    else if (state === "ask_category") {
      if (inputId === "cat_general" || inputId === "cat_programs" || inputId === "cat_avail") {
        const catMap: Record<string, "general" | "programs" | "availability"> = {
          cat_general: "general", cat_programs: "programs", cat_avail: "availability"
        };
        meta.ask_category = catMap[inputId] || "general";
        await sendText(from, "Go ahead, ask me anything! 💬", conversation.id);
        state = "freeform_qa";
      } else {
        // Treat as a general question directly
        meta.ask_category = "general";
        state = "freeform_qa";
        await handleAIQuestion(from, conversation, config, "general", ctx);
      }
    }
    // ── FREEFORM Q&A ──
    else if (state === "freeform_qa") {
      // Check if user wants to go back to menu
      if (text.toLowerCase() === "menu" || inputId === "back_menu") {
        await sendButtons(from,
          "Back to the main menu! 👋 What would you like to do?",
          [
            { id: "choice_learn", title: "I Want to Learn 📚" },
            { id: "choice_ask", title: "Ask a Question 💬" },
            { id: "choice_task", title: "Complete a Task ✅" },
          ],
          conversation.id
        );
        state = "menu_pending";
      } else {
        const cat = meta.ask_category || "general";
        await handleAIQuestion(from, conversation, config, cat, ctx);
      }
    }
    // ── TASK SELECTION ──
    else if (state === "task_pending") {
      if (inputId === "task_book") {
        meta.flow = "booking";
        meta.booking_step = "name";
        await sendText(from, "Let's book a training session! 📅\n\nWhat's your full name?", conversation.id);
        state = "task_active";
      } else if (inputId === "task_message") {
        meta.flow = "contact";
        meta.contact_step = "name";
        await sendText(from, "I'll help you send a message to our team! 📝\n\nWhat's your name?", conversation.id);
        state = "task_active";
      } else {
        await sendButtons(from,
          "Please select a task 👇",
          [
            { id: "task_book", title: "Book Training 📅" },
            { id: "task_message", title: "Send a Message 💬" },
          ],
          conversation.id
        );
      }
    }
    // ── ACTIVE TASK (handled above in flow section) ──
    else if (state === "task_active") {
      // If flow was completed (meta.flow reset), go back to menu
      if (!meta.flow) {
        await sendButtons(from,
          "What would you like to do next?",
          [
            { id: "choice_learn", title: "I Want to Learn 📚" },
            { id: "choice_ask", title: "Ask a Question 💬" },
            { id: "choice_task", title: "Complete a Task ✅" },
          ],
          conversation.id
        );
        state = "menu_pending";
      }
    }
    // ── ONBOARDING QUIZ FLOW ──
    else if (state === "q1_pending") {
      if (inputId === "start_yes") {
        const q = quiz.questions?.[0];
        if (q) {
          await sendButtons(from, q.text, q.options, conversation.id);
          state = "q1_answered";
        }
      } else {
        // Re-send welcome
        if (quiz.welcome) {
          await sendButtons(from, quiz.welcome.body, quiz.welcome.buttons, conversation.id);
        }
      }
    }
    else if (state === "q1_answered") {
      meta.q1_experience = inputId;
      const q = quiz.questions?.[1];
      if (q) {
        await sendButtons(from, q.text, q.options, conversation.id);
        state = "q2_answered";
      }
    }
    else if (state === "q2_answered") {
      meta.q2_time = inputId;
      const q = quiz.questions?.[2];
      if (q) {
        await sendButtons(from, q.text, q.options, conversation.id);
        state = "q3_answered";
      }
    }
    else if (state === "q3_answered") {
      meta.q3_goal = inputId;
      const rec = quiz.recommendation;
      if (rec) {
        const isIntermediate = rec.intermediate_triggers?.includes(meta.q1_experience);
        const bodyText = rec.base_text.replace("{program}", isIntermediate ? "Intermediate" : "Beginner");
        await sendButtons(from, bodyText, [rec.details_button], conversation.id);
        state = "details_pending";
      }
    }
    else if (state === "details_pending") {
      if (inputId === "send_details") {
        if (quiz.details) {
          await sendText(from, `Details: ${quiz.details.link}`, conversation.id);
          await sendText(from, quiz.details.message, conversation.id);
        }
        state = "name_pending";
      }
    }
    else if (state === "name_pending") {
      meta.captured_name = text;
      // Update conversation with captured name
      await supabase.from("conversations").update({ whatsapp_name: text }).eq("id", conversation.id);

      if (quiz.handoff) {
        await sendText(from, quiz.handoff.replace("{name}", text), conversation.id);
      }
      // After onboarding, show main menu
      await sendButtons(from,
        "What would you like to do next?",
        [
          { id: "choice_learn", title: "I Want to Learn 📚" },
          { id: "choice_ask", title: "Ask a Question 💬" },
          { id: "choice_task", title: "Complete a Task ✅" },
        ],
        conversation.id
      );
      state = "menu_pending";
    }
    // ── FALLBACK: any unknown state → AI response then menu ──
    else {
      await handleAIQuestion(from, conversation, config, "general", ctx);
      state = "freeform_qa";
      meta.ask_category = "general";
    }

    // Save state
    meta.onboarding_state = state;
    await supabase.from("conversations").update({ metadata: meta }).eq("id", conversation.id);

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Error", { status: 500 });
  }
});
