const { sendJson } = require("./_lib/http");
const { EMAIL_FROM, EMAIL_TO, POSTMARK_TOKEN } = process.env;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  let body;
  try { body = JSON.parse(req.body); } catch { return sendJson(res, 400, {error:"Invalid JSON"}); }

  const { name, email, phone, subject, message, opt_in, recaptcha } = body;

  // light validation
  if (!name || !email || !message) {
    return sendJson(res, 400, { error: "Name, email, and message are required." });
  }
  // simple email heuristic
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    return sendJson(res, 400, { error: "Please provide a valid email address." });
  }

  // verify reCAPTCHA
  try {
    const r = await (
      await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptcha)}`
      })
    ).json();
    if(!r.success) throw new Error("reCAPTCHA verification failed.");
  } catch (e) {
    return sendJson(res, 400, { error: "reCAPTCHA verification failed." });
  }

  // build email with Postmark SDK (simple REST)
  const payload = {
    From:      `${name} <${EMAIL_FROM}>`,
    To:        EMAIL_TO,
    Subject:   `Old Glory Contact – ${subject}`,
    TextBody:  stripHtml(`Name: ${name}\nEmail: ${email}\nPhone: ${phone||""}\nSubject: ${subject}\nMessage:\n${message}\n\n${opt_in?"Email opt-in consented":"Email opt: no"}`)
  };

  try {
    await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_TOKEN
      },
      body: JSON.stringify(payload)
    });
    return sendJson(res, 200, { ok: true });
  } catch (e) {
    return sendJson(res, 500, { error: "Unable to send email. Please try again or call directly." });
  }

  function stripHtml(str){
    return str.replace(/[<>]/g,' ');
  }
};