import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─────────────────────────────────────────────
// AI PROVIDER LAYER (Reused from whatsapp-webhook)
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

  return "FAILED TO GENERATE ANALYSIS";
}

// ─────────────────────────────────────────────
// MAIN GENERATOR HANDLER
// ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Check for optional date in body
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1); // Default to yesterday
    
    try {
      if (req.method === "POST") {
        const body = await req.clone().json();
        if (body.date) targetDate = new Date(body.date);
      }
    } catch (e) {
      console.log("[Reports] No valid JSON body or date provided, using default.");
    }

    const dateStr = targetDate.toISOString().split('T')[0];
    const startTime = new Date(dateStr);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(dateStr);
    endTime.setHours(23, 59, 59, 999);

    console.log(`[Reports] Generating report for period: ${startTime.toISOString()} to ${endTime.toISOString()}`);

    // 1. Fetch data from Supabase
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("role, content, created_at, conversations(whatsapp_phone, whatsapp_name)")
      .gte("created_at", startTime.toISOString())
      .lte("created_at", endTime.toISOString());

    const { data: leads, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .gte("created_at", startTime.toISOString())
      .lte("created_at", endTime.toISOString());

    if (msgError || leadError) throw msgError || leadError;

    console.log(`[Reports] Fetched ${messages?.length || 0} messages and ${leads?.length || 0} leads.`);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `No activity found for ${dateStr}. Please interact with the bot first then try again.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Prepare analysis context
    const transcript = (messages || [])
      .map((m: any) => `${m.role === "user" ? "User" : "AI"} (${m.conversations?.whatsapp_phone}): ${m.content}`)
      .join("\n")
      .substring(0, 10000);

    const leadSummary = (leads || [])
      .length > 0 
        ? leads.map((l: any) => `- ${l.name} (${l.status}): ${l.training_interest}`).join("\n")
        : "No new leads captured today.";

    const systemPrompt = `You are a professional business analyst for Deriv Champions.
Your task is to analyze the provided WhatsApp conversation transcripts and lead data for the date ${dateStr}.

IMPORTANT: You MUST return ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or preamble.

JSON SCHEMA:
{
  "report_title": "Short, catchy summary title (max 6 words)",
  "summary": "2-paragraph analysis",
  "sentiment": "Positive/Neutral/Curious/Frustrated",
  "top_inquiries": ["Topic 1", "Topic 2", "Topic 3"],
  "lead_insights": "Analysis of lead quality",
  "kpis": { 
    "total_messages": ${messages.length}, 
    "unique_users": ${new Set(messages.map(m => m.conversations?.whatsapp_phone)).size}, 
    "conversion_rate": "XX%" 
  }
} `;

    const analysisRaw = await callAIWithFallback(systemPrompt, [{ role: "user", content: `TRANSCRIPT:\n${transcript}\n\nLEADS:\n${leadSummary}` }]);
    
    // Clean AI response (Strip markdown blocks if present)
    let cleanJson = analysisRaw.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }
    
    // Fallback regex if still not clean
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Reports] Raw AI Response:", analysisRaw);
      throw new Error("AI analysis did not return a valid JSON structure.");
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    // 3. Generate PDF with jsPDF
    const doc = new jsPDF();
    const margin = 20;
    let yPos = 30;

    // Colors
    const primaryColor = [234, 68, 68]; // Deriv Red
    const secondaryColor = [40, 40, 40]; // Dark Grey
    const accentColor = [255, 235, 235]; // Light Red

    // Logo & Header
    try {
      const { data: logoBlob, error: downloadError } = await supabase.storage
        .from("logo")
        .download("deriv-logo.png");

      if (logoBlob && !downloadError) {
        const logoData = new Uint8Array(await logoBlob.arrayBuffer());
        // Position logo in the center (A4 width is 210, logo width is 45)
        doc.addImage(logoData, "PNG", 82.5, 10, 45, 12);
      } else {
        console.warn("Could not download logo from storage:", downloadError);
        // Fallback centered title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("DERIV CHAMPIONS", 105, 22, { align: "center" });
      }
    } catch (e) {
      console.warn("Error during logo processing:", e);
      // Inline centered title fallback
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("DERIV CHAMPIONS", 105, 22, { align: "center" });
    }
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    // Dynamic AI Generated Sub-header (centered below the logo area)
    const displayTitle = (analysis.report_title || "DAILY PERFORMANCE INSIGHTS").toUpperCase();
    doc.text(displayTitle, 105, 24, { align: "center" });

    // Header Line - Positioned clearly below title and logo
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, 28, 190, 28);
    
    yPos = 40; // Safely below the line
    
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Daily Performance Report: ${dateStr}`, margin, yPos);
    yPos += 15;

    // Stats Grid Layout (Enhanced)
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(margin, yPos, 170, 35, 3, 3, "F");
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("MESSAGES VOLUME", margin + 10, yPos + 12);
    doc.text("LEADS CAPTURED", margin + 60, yPos + 12);
    doc.text("UNIQUE USERS", margin + 110, yPos + 12);
    doc.text("ENGAGEMENT", margin + 145, yPos + 12);

    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${messages?.length || 0}`, margin + 10, yPos + 25);
    doc.text(`${leads?.length || 0}`, margin + 60, yPos + 25);
    doc.text(`${analysis.kpis.unique_users}`, margin + 110, yPos + 25);
    doc.text(`${analysis.kpis.conversion_rate}`, margin + 145, yPos + 25);
    yPos += 50;

    // Executive Summary
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 5, 190, yPos - 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Executive Summary", margin, yPos);
    yPos += 10;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60);
    const splitSummary = doc.splitTextToSize(analysis.summary, 170);
    doc.text(splitSummary, margin, yPos, { lineHeightFactor: 1.5 });
    yPos += (splitSummary.length * 7) + 15;

    // Sentiment & Top Topics
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(margin, yPos - 5, 170, 8, "F");
    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.text(`Market Sentiment: ${analysis.sentiment.toUpperCase()}`, margin + 5, yPos + 1);
    yPos += 15;

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Top Inquiries Today", margin, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    analysis.top_inquiries.forEach((item: string) => {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.circle(margin + 2, yPos - 1.5, 0.8, "F");
      doc.text(item, margin + 8, yPos);
      yPos += 8;
    });
    yPos += 10;

    // Lead Insights Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Strategic Lead Insights", margin, yPos);
    yPos += 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100);
    const splitLeads = doc.splitTextToSize(analysis.lead_insights, 170);
    doc.text(splitLeads, margin, yPos, { lineHeightFactor: 1.4 });

    // Page Border
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.1);
    doc.rect(5, 5, 200, 287);

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text(`Confidential • Generated by Deriv AI • ${new Date().toLocaleString()}`, 105, 285, { align: "center" });

    // 4. Finalize PDF as Uint8Array
    const pdfOutput = doc.output("arraybuffer");

    // 5. Upload to Storage
    const fileName = `daily_report_${dateStr}.pdf`;
    const filePath = `reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(filePath, pdfOutput, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("reports")
      .getPublicUrl(filePath);

    // 6. Record in DB
    const { error: dbError } = await supabase
      .from("daily_reports")
      .upsert({
        report_date: dateStr,
        title: analysis.report_title || `Deriv Champions Daily Report - ${dateStr}`,
        stats: {
          total_messages: messages?.length || 0,
          new_leads: leads?.length || 0,
          ...analysis.kpis
        },
        ai_analysis: analysisRaw,
        pdf_url: publicUrl,
        pdf_path: filePath
      }, { onConflict: "report_date" });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[Reports] Generation Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
