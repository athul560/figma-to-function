import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";


const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignmentEmailRequest {
  staffEmail: string;
  staffName: string;
  complaintNumber: string;
  complaintTitle: string;
  complaintId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { staffEmail, staffName, complaintNumber, complaintTitle, complaintId }: AssignmentEmailRequest = await req.json();

    console.log("Sending assignment email to:", staffEmail);

    const emailResponse = await resend.emails.send({
      from: "Brototype CMS <onboarding@resend.dev>",
      to: [staffEmail],
      subject: `New Complaint Assigned: ${complaintNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Complaint Assigned</h1>
          <p>Hi ${staffName},</p>
          <p>You have been assigned to a new complaint:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Complaint ID:</strong> ${complaintNumber}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${complaintTitle}</p>
          </div>
          
          <p>Please review and take appropriate action.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            Brototype Complaint Management System
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending assignment email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
