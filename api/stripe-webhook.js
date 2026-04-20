import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Vercel: disable body parsing so we receive the raw buffer for signature verification
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role bypasses RLS
);

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email =
      session.customer_details?.email ?? session.customer_email ?? null;
    const customerId = session.customer ?? null;

    if (email) {
      const { error } = await supabase
        .from("profiles")
        .update({ subscribed: true, stripe_customer_id: customerId })
        .eq("email", email);

      if (error) {
        console.error("Supabase update failed:", error.message);
        res.status(500).json({ error: "Database update failed" });
        return;
      }
    } else {
      console.warn("checkout.session.completed: no customer email found");
    }
  }

  res.status(200).json({ received: true });
}
