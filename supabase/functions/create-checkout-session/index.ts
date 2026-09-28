// Supabase Edge Function — creates a Stripe Checkout Session for the embedded form on /pay.
// Deploy: supabase functions deploy create-checkout-session --no-verify-jwt
import Stripe from "npm:stripe@^22.6.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2026-03-25.dahlia; custom_checkout_payment_form_preview=v1" as Stripe.LatestApiVersion,
});
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://ecomosaicsrestoration.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_URL,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  // TODO: Set mode to "subscription" if selling recurring products.
  const mode = "payment";

  const sessionParams: Record<string, unknown> = {
    ui_mode: "form",
    mode,
    line_items: [{ price: "price_...", quantity: 1 }], // TODO: replace with a real Price ID
    billing_address_collection: "auto",
    phone_number_collection: { enabled: false },
    automatic_tax: { enabled: false },
    submit_type: "auto",
    integration_identifier: "custom_embedded_web_0001",
    return_url: `${SITE_URL}/payment-received/?session_id={CHECKOUT_SESSION_ID}`,
  };
  if (mode === "subscription") {
    sessionParams.payment_method_collection = "always";
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams as Stripe.Checkout.SessionCreateParams);
    return Response.json({ client_secret: session.client_secret }, { headers: corsHeaders });
  } catch (err) {
    console.error("Checkout Session creation failed:", err);
    return Response.json({ error: "Unable to start checkout" }, { status: 500, headers: corsHeaders });
  }
});
