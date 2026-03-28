import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { table, record, type } = payload;

    if (type !== "INSERT") {
      return new Response(JSON.stringify({ message: "Only INSERT events are handled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let userEmail = "";
    let userName = "";
    let subject = "";
    let htmlContent = "";

    // 1. Determine Submission Type
    if (table === "bookings") {
      userEmail = record.email;
      userName = `${record.first_name} ${record.last_name}`;
      subject = "Application Confirmed — Trading Mastery Programme";
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #ea580c;">Application Shared Successfully!</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for applying for a spot in our training programme. Steve has received your request and will reach out to you personally via WhatsApp or Phone within the next hour to finalize your enrollment.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Booking Details:</strong></p>
          <ul>
            <li><strong>Date:</strong> ${record.booking_date}</li>
            <li><strong>Preferred Time:</strong> ${record.start_time}</li>
            <li><strong>Format:</strong> ${record.is_online ? "Online session" : "In-person (Kisumu)"}</li>
          </ul>
          <p>See you on the charts!</p>
          <p>— The Deriv Champions Team</p>
        </div>
      `;
    } else if (table === "contact_messages") {
      userEmail = record.email;
      userName = record.name;
      subject = "Message Received — Deriv Champions Inquiry";
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #ea580c;">We've received your inquiry</h2>
          <p>Hello ${userName},</p>
          <p>Thank you for reaching out to Deriv Champions. Steve will review your message and get back to you as soon as possible (usually within an hour during business hours).</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Your Inquiry:</strong></p>
          <p><em>"${record.message}"</em></p>
          <p>— The Deriv Champions Team</p>
        </div>
      `;
    } else if (table === "training_requests") {
      userEmail = record.email;
      userName = `${record.first_name} ${record.last_name}`;
      subject = "Training Interest Received — Deriv Champions";
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #ea580c;">Interest Registered!</h2>
          <p>Hi ${userName},</p>
          <p>We've registered your interest in ${record.interest}. Steve will reach out shortly to discuss your trading goals and find the best path forward for you.</p>
          <p>— The Deriv Champions Team</p>
        </div>
      `;
    }

    // 2. Send Acknowledgment Email to User
    if (userEmail && RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Deriv Champions <${SENDER_EMAIL}>`,
          to: [userEmail],
          subject: subject,
          html: htmlContent,
        }),
      });

      // 3. Send Notification Email to Admin
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `System <${SENDER_EMAIL}>`,
          to: [ADMIN_EMAIL],
          subject: `New ${table} Submission: ${userName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>New interaction on your site</h2>
              <p>Someone just interacted with the <strong>${table}</strong> table.</p>
              <ul>
                <li><strong>Name:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                <li><strong>Contact Phone:</strong> ${record.phone || record.whatsapp_phone || "N/A"}</li>
              </ul>
              <p>Check the dashboard for more details.</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
