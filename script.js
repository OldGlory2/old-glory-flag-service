const UTAH_COUNTY_ZIPS = new Set([
  "84003","84004","84005","84013","84042","84043","84045","84057","84058","84059",
  "84062","84097","84601","84602","84604","84606","84626","84628","84633","84651",
  "84653","84655","84660","84663","84664"
]);

function validateZip(zip) {
  const clean = String(zip || "").trim();
  return UTAH_COUNTY_ZIPS.has(clean);
}

document.addEventListener("DOMContentLoaded", () => {
  const zipInput = document.querySelector("#zip");
  const zipMsg = document.querySelector("#zip-msg");
  const form = document.querySelector("#checkout-form");
  const checkoutMsg = document.querySelector("#checkout-msg");
  const checkoutSubmit = document.querySelector("#checkout-submit");

  if (!zipInput || !zipMsg || !form) return;

  function setMessage(el, message, isError) {
    if (!el) return;
    el.textContent = message || "";
    el.className = isError ? "err" : "ok";
  }

  zipInput.addEventListener("blur", () => {
    if (!zipInput.value.trim()) {
      zipMsg.textContent = "";
      return;
    }
    if (validateZip(zipInput.value)) {
      zipMsg.textContent = "ZIP is in Utah County service area.";
      zipMsg.className = "ok";
    } else {
      zipMsg.textContent = "ZIP is outside current service area. Contact us before checkout.";
      zipMsg.className = "err";
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const zip = zipInput.value.trim();
    if (!validateZip(zip)) {
      setMessage(zipMsg, "Please enter a valid Utah County ZIP code.", true);
      return;
    }

    const selectedPlan = document.querySelector("input[name='plan']:checked");
    const payload = {
      plan: selectedPlan ? selectedPlan.value : "",
      email: String(document.querySelector("#email")?.value || "").trim(),
      name: String(document.querySelector("#name")?.value || "").trim(),
      phone: String(document.querySelector("#phone")?.value || "").trim(),
      address: String(document.querySelector("#address")?.value || "").trim(),
      city: String(document.querySelector("#city")?.value || "").trim(),
      state: String(document.querySelector("#state")?.value || "").trim(),
      zip
    };

    checkoutSubmit.disabled = true;
    setMessage(checkoutMsg, "Creating secure checkout session...", false);

    fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to start checkout.");
        }
        if (!data.url) {
          throw new Error("Checkout URL missing from server response.");
        }
        window.location.href = data.url;
      })
      .catch((error) => {
        setMessage(checkoutMsg, error.message || "Checkout failed. Please try again.", true);
      })
      .finally(() => {
        checkoutSubmit.disabled = false;
      });
  });
});

// contact form + reCAPTCHA
(function() {
  const cForm = document.getElementById('contact-form');
  const cStatus = document.getElementById('c-status');
  if (!cForm || !cStatus) return;

  const setMessage = (msg, isErr) => {
    cStatus.textContent = msg;
    cStatus.className = isErr ? 'small err' : 'small ok';
  };

  cForm.addEventListener('submit', e => {
    e.preventDefault();
    const resp = grecaptcha.getResponse();
    if (!resp) {
      setMessage('Please complete the reCAPTCHA.', true);
      return;
    }

    const data = {
      name:    cForm.name.value.trim(),
      email:   cForm.email.value.trim(),
      phone:   cForm.phone.value.trim(),
      subject: cForm.subject.value,
      message: cForm.message.value.trim(),
      opt_in:  cForm.opt_in?.checked || false,
      recaptcha: resp
    };

    setMessage('Sending...', false);
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setMessage('Message sent! We\'ll be in touch soon.', false);
        cForm.reset();
        grecaptcha.reset();
      })
      .catch(err => setMessage('Sorry, there was an error.', true));
  });
})();
