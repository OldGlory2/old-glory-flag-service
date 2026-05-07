const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

function getPriceIdForPlan(plan) {
  if (plan === "standard") return process.env.STRIPE_PRICE_STANDARD;
  if (plan === "pioneer") return process.env.STRIPE_PRICE_PIONEER;
  return null;
}

module.exports = {
  stripe,
  getPriceIdForPlan
};
