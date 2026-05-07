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

  if (!zipInput || !zipMsg || !form) return;

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
    const zip = zipInput.value;
    if (!validateZip(zip)) {
      zipMsg.textContent = "Please enter a valid Utah County ZIP code.";
      zipMsg.className = "err";
      return;
    }
    alert("Ready for Stripe Checkout integration.");
  });
});
