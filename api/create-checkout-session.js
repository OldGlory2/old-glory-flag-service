const { isUtahCountyZip } = require("./_lib/utahCountyZips");
const { stripe, getPriceIdForPlan } = require("./_lib/stripeClient");
const { sendJson } = require("./_lib/http");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const { plan, email, name, phone, address, city, state, zip } = req.body || {};

    if (!email) {
      return sendJson(res, 400, { error: "Email is required." });
    }

    if (!isUtahCountyZip(zip)) {
      return sendJson(res, 400, { error: "Service is only available in Utah County ZIP codes." });
    }

    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      return sendJson(res, 400, { error: "Invalid plan selected." });
    }

    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1
    });

    let customer = existingCustomers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email,
        name: name || undefined,
        phone: phone || undefined,
        address: {
          line1: address || undefined,
          city: city || undefined,
          state: state || undefined,
          postal_code: zip || undefined,
          country: "US"
        },
        metadata: {
          service_zip: String(zip || ""),
          service_city: String(city || ""),
          service_state: String(state || "UT")
        }
      });
    } else {
      customer = await stripe.customers.update(customer.id, {
        name: name || customer.name || undefined,
        phone: phone || customer.phone || undefined,
        address: {
          line1: address || undefined,
          city: city || undefined,
          state: state || undefined,
          postal_code: zip || undefined,
          country: "US"
        },
        metadata: {
          ...customer.metadata,
          service_zip: String(zip || ""),
          service_city: String(city || ""),
          service_state: String(state || "UT")
        }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      consent_collection: { terms_of_service: "required" },
      metadata: {
        plan: String(plan),
        service_zip: String(zip || "")
      },
      subscription_data: {
        metadata: {
          plan: String(plan),
          service_zip: String(zip || ""),
          service_suspended: "false"
        }
      },
      customer_update: {
        name: "auto",
        address: "auto"
      },
      success_url: `${process.env.APP_URL}/checkout.html?status=success`,
      cancel_url: `${process.env.APP_URL}/checkout.html?status=cancelled`
    });

    return sendJson(res, 200, { url: session.url });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return sendJson(res, statusCode, { error: error.message || "Unexpected server error." });
  }
};
