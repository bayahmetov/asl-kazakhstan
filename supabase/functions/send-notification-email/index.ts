import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  user_id: string;
  notification_type: string;
  title: string;
  content: string;
  link?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, notification_type, title, content, link }: NotificationEmailRequest = await req.json();

    console.log("Processing email notification:", { user_id, notification_type, title });

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check user's email preferences
    const { data: preferences, error: prefError } = await supabaseClient
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      return new Response(JSON.stringify({ error: "Failed to fetch preferences" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map notification types to preference fields
    const preferenceMap: Record<string, string> = {
      "homework_submitted": "email_homework_submitted",
      "homework_feedback": "email_homework_feedback",
      "lesson_published": "email_lesson_published",
      "course_enrolled": "email_course_enrolled",
      "support_reply": "email_support_reply",
      "message_reply": "email_message_reply",
    };

    const preferenceField = preferenceMap[notification_type];
    
    // Check if email is enabled for this notification type
    if (!preferenceField || !preferences[preferenceField]) {
      console.log(`Email disabled for notification type: ${notification_type}`);
      return new Response(JSON.stringify({ message: "Email notification disabled by user" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's email
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to fetch user profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email HTML
    const linkHtml = link 
      ? `<p style="margin: 20px 0;"><a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || ''}${link}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a></p>`
      : '';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${title}</h2>
        <p style="color: #666; line-height: 1.6;">${content}</p>
        ${linkHtml}
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          You received this email because you have notifications enabled. 
          You can manage your notification preferences in your profile settings.
        </p>
      </div>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "RSL Kazakhstan <onboarding@resend.dev>",
      to: [profile.email],
      subject: title,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
