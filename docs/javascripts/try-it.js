// The Try it page: send requests to the in-browser Relay sandbox.
// The operations come from operations.json, which is generated from
// api/openapi.yaml. The sandbox logic is in sandbox.js.

import { handle, resetSandbox, SANDBOX_KEYS } from "./sandbox.js";

const BASE_URL = "https://api.relay.example/v1";
const root = document.getElementById("try-it");

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
};

async function start() {
  const response = await fetch(new URL("operations.json", import.meta.url));
  const operations = await response.json();

  // Operation picker, grouped by tag.
  const select = el("select", { id: "tryit-operation" });
  const groups = {};
  for (const op of operations) {
    groups[op.tag] ??= select.appendChild(el("optgroup", { label: op.tag }));
    groups[op.tag].append(el("option", { value: op.operationId, text: `${op.summary}  (${op.method} ${op.path})` }));
  }

  const keySelect = el("select", { id: "tryit-key" },
    el("option", { value: SANDBOX_KEYS.readWrite, text: `Read-write: ${SANDBOX_KEYS.readWrite}` }),
    el("option", { value: SANDBOX_KEYS.readOnly, text: `Read-only: ${SANDBOX_KEYS.readOnly}` }),
    el("option", { value: "", text: "No API key" }));

  const paramsBox = el("div", { class: "tryit-params" });
  const bodyLabel = el("label", { for: "tryit-body", text: "Request body (JSON)" });
  const body = el("textarea", { id: "tryit-body", rows: "6", spellcheck: "false" });
  const bodyBox = el("div", { class: "tryit-field" }, bodyLabel, body);
  const reference = el("a", { class: "tryit-reference" });
  const curl = el("pre", { class: "tryit-curl" }, el("code"));
  const send = el("button", { type: "submit", class: "md-button md-button--primary", text: "Send request" });
  const reset = el("button", { type: "button", class: "md-button", text: "Reset sandbox data" });
  const status = el("p", { class: "tryit-status", role: "status", "aria-live": "polite" });
  const output = el("pre", { class: "tryit-response", hidden: "" }, el("code"));

  const form = el("form", { class: "tryit-form" },
    el("div", { class: "tryit-field" }, el("label", { for: "tryit-operation", text: "Operation" }), select, reference),
    el("div", { class: "tryit-field" }, el("label", { for: "tryit-key", text: "API key" }), keySelect),
    paramsBox, bodyBox,
    el("p", { class: "tryit-label", text: "The same request with curl" }), curl,
    el("div", { class: "tryit-actions" }, send, reset));

  root.replaceChildren(form, el("h2", { id: "response", text: "Response" }), status, output);
  status.textContent = "Send a request to see the response here.";

  const current = () => operations.find((op) => op.operationId === select.value);

  function buildUrl(op) {
    let path = op.path;
    const query = new URLSearchParams();
    for (const p of op.params) {
      const value = document.getElementById(`tryit-p-${p.name}`).value.trim();
      if (p.in === "path") path = path.replace(`{${p.name}}`, encodeURIComponent(value));
      else if (value !== "") query.set(p.name, value);
    }
    const qs = query.toString();
    return path + (qs ? `?${qs}` : "");
  }

  function updateCurl() {
    const op = current();
    const url = BASE_URL + buildUrl(op);
    const lines = [`curl ${op.method === "GET" ? "" : `-X ${op.method} `}"${url}" \\`,
      `  -H "Authorization: Bearer ${keySelect.value || "<your API key>"}"`];
    if (op.body !== null && body.value.trim()) {
      lines[1] += " \\";
      lines.push('  -H "Content-Type: application/json" \\', `  -d '${body.value.trim()}'`);
    }
    curl.firstChild.textContent = lines.join("\n");
  }

  function showOperation() {
    const op = current();
    reference.textContent = `${op.summary} in the reference`;
    reference.href = op.reference;
    paramsBox.replaceChildren(...op.params.map((p) => {
      const id = `tryit-p-${p.name}`;
      const hint = [p.in === "path" ? "Path parameter, required." : "Query parameter, optional.", p.description,
        p.enum ? `One of: ${p.enum.join(", ")}.` : "", p.default !== null && p.default !== undefined ? `Default: ${p.default}.` : ""]
        .filter(Boolean).join(" ");
      const input = el("input", { id, type: "text", "aria-describedby": `${id}-hint`, autocomplete: "off" });
      input.value = p.in === "path" ? (p.example ?? "") : "";
      if (p.in === "query" && p.example !== null && p.example !== undefined) input.placeholder = String(p.example);
      input.addEventListener("input", updateCurl);
      return el("div", { class: "tryit-field" }, el("label", { for: id }, el("code", { text: p.name })), input,
        el("p", { id: `${id}-hint`, class: "tryit-hint", text: hint }));
    }));
    bodyBox.hidden = op.body === null;
    body.value = op.body === null ? "" : JSON.stringify(op.body, null, 2);
    updateCurl();
  }

  select.addEventListener("change", showOperation);
  keySelect.addEventListener("change", updateCurl);
  body.addEventListener("input", updateCurl);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const op = current();
    let parsed;
    if (op.body !== null && body.value.trim()) {
      try {
        parsed = JSON.parse(body.value);
      } catch {
        status.textContent = "The request body isn't valid JSON, so the request wasn't sent. Check for a missing quotation mark, comma, or brace.";
        output.hidden = true;
        return;
      }
    }
    const result = handle({ method: op.method, url: buildUrl(op), apiKey: keySelect.value, body: parsed });
    status.textContent = `${result.status} ${result.status < 300 ? "Success" : "Error"}: ${op.method} ${buildUrl(op)}`;
    output.firstChild.textContent = JSON.stringify(result.body, null, 2);
    output.hidden = false;
  });

  reset.addEventListener("click", () => {
    resetSandbox();
    status.textContent = "The sandbox data is back to its starting state.";
    output.hidden = true;
  });

  // Open a specific operation from a link, such as try-it/#updateDevice.
  const fromHash = decodeURIComponent(location.hash.slice(1));
  if (operations.some((op) => op.operationId === fromHash)) select.value = fromHash;
  showOperation();
}

start().catch(() => {
  root.textContent = "The sandbox couldn't load. Reload the page to try again.";
});
