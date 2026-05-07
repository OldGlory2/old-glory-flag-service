const { stripe } = require("./_lib/stripeClient");
const { sendJson, readRawBody } = require("./_lib/http");

async function pauseSubscription(subscriptionId, metadata) {
  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: { behavior: "void" },
    metadata: {
      ...metadata,
      service_suspended: "true"
    }
  });
}

async function resumeSubscription(subscriptionId, metadata) {
  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: null,
    metadata: {
      ...metadata,
      service_suspended: "false",
      grace_period_ends_at: ""
    }
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "checkout.session.completed": {
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const now = Date.now();
        const graceEndsAt = Number(subscription.metadata.grace_period_ends_at || 0);

        if (!graceEndsAt || graceEndsAt < now) {
          const nextGraceEnd = now + (7 * 24 * 60 * 60 * 1000);
          await stripe.subscriptions.update(subscription.id, {
            metadata: {
              ...subscription.metadata,
              grace_period_ends_at: String(nextGraceEnd),
              service_suspended: "false"
            }
          });
        } else if (now >= graceEndsAt) {
          await pauseSubscription(subscription.id, subscription.metadata);
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        await resumeSubscription(subscription.id, subscription.metadata);
        break;
      }
      case "customer.subscription.updated": {
        break;
      }
      default:
        break;
    }

    return sendJson(res, 200, { received: true });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || "Webhook handling failed." });
  }
};
