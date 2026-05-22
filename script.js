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