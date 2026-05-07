const { sendJson } = require("./_lib/http");

module.exports = async (req, res) => {
  return sendJson(res, 403, {
    error: "Direct portal session creation is disabled for security. Use Stripe receipt/customer emails for authenticated billing management links."
  });
};
