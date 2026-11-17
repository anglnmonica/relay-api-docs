// Relay API sandbox: a fake server that runs in the browser.
//
// It implements every operation in api/openapi.yaml with the same rules
// the docs describe: validation, read-only keys, pagination, and errors.
// Nothing is sent over the network, and the data resets when the page
// reloads.
//
// api/sandbox-contract-test.mjs checks every response against the spec,
// so the sandbox can't drift from the docs.

export const SANDBOX_KEYS = {
  readWrite: "rk_test_readwrite",
  readOnly: "rk_test_readonly",
};

const TIME_ZONE = /^[A-Za-z]+(?:\/[A-Za-z0-9_+-]+)+$|^UTC$/;

function seed() {
  return {
    sites: [
      { id: "site_7Kq2nP", name: "Oakland distribution center", time_zone: "America/Los_Angeles", created_at: "2026-09-14T17:02:11Z" },
      { id: "site_4Mz8Lc", name: "Port of Long Beach terminal 2", time_zone: "America/Los_Angeles", created_at: "2026-10-02T15:20:45Z" },
    ],
    devices: [
      { id: "dev_A1b2C3", site_id: "site_7Kq2nP", name: "Dock door 4", type: "access_point", model: "RL-AP200", serial_number: "RLA2006Q4K19", status: "online", firmware_version: "4.2.1", radio: { band: "n48", channel_bandwidth_mhz: 20, transmit_power_dbm: 23 }, last_seen_at: "2026-11-17T18:29:41Z" },
      { id: "dev_D4e5F6", site_id: "site_7Kq2nP", name: "Mezzanine east", type: "access_point", model: "RL-AP200", serial_number: "RLA2006Q4K44", status: "offline", firmware_version: "4.2.1", radio: { band: "n48", channel_bandwidth_mhz: 20, transmit_power_dbm: 23 }, last_seen_at: "2026-11-17T17:45:03Z" },
      { id: "dev_G7h8J9", site_id: "site_7Kq2nP", name: "Core gateway", type: "gateway", model: "RL-GW10", serial_number: "RLG1004T7P02", status: "online", firmware_version: "4.2.0", last_seen_at: "2026-11-17T18:29:58Z" },
      { id: "dev_K2l3M4", site_id: "site_4Mz8Lc", name: "Crane 7", type: "access_point", model: "RL-AP400", serial_number: "RLA4001B2Z88", status: "online", firmware_version: "4.2.1", radio: { band: "n48", channel_bandwidth_mhz: 40, transmit_power_dbm: 26 }, last_seen_at: "2026-11-17T18:29:12Z" },
      { id: "dev_N5p6Q7", site_id: "site_4Mz8Lc", name: "Gate house", type: "access_point", model: "RL-AP200", serial_number: "RLA2006R1C07", status: "provisioning", firmware_version: "4.1.3", radio: { band: "n48", channel_bandwidth_mhz: 20, transmit_power_dbm: 23 }, last_seen_at: null },
    ],
    alerts: [
      { id: "alt_Q7m4Zs", site_id: "site_7Kq2nP", device_id: "dev_D4e5F6", severity: "critical", type: "device_offline", message: "Access point \"Mezzanine east\" hasn't responded for 10 minutes.", status: "open", created_at: "2026-11-17T17:55:00Z", acknowledged_at: null, acknowledged_note: null },
      { id: "alt_N3v8Hq", site_id: "site_7Kq2nP", device_id: "dev_A1b2C3", severity: "major", type: "radio_interference", message: "Access point \"Dock door 4\" detected interference on its channel.", status: "open", created_at: "2026-11-17T16:40:00Z", acknowledged_at: null, acknowledged_note: null },
      { id: "alt_B6c2Rw", site_id: "site_4Mz8Lc", device_id: "dev_K2l3M4", severity: "minor", type: "certificate_expiring", message: "The certificate on access point \"Crane 7\" expires in 21 days.", status: "acknowledged", created_at: "2026-11-15T09:12:00Z", acknowledged_at: "2026-11-15T16:30:21Z", acknowledged_note: "Renewal scheduled for the next maintenance window." },
      { id: "alt_T9y1Ux", site_id: "site_4Mz8Lc", device_id: null, severity: "info", type: "high_cpu", message: "The gateway at this site recovered from high processor use.", status: "resolved", created_at: "2026-11-10T22:03:00Z", acknowledged_at: null, acknowledged_note: null },
    ],
    nextId: 1,
    requestCount: 0,
  };
}

let db = seed();

export function resetSandbox() {
  db = seed();
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

function requestId() {
  db.requestCount += 1;
  return "req_sbx" + String(db.requestCount).padStart(4, "0");
}

function respond(status, body) {
  return {
    status,
    headers: { "Content-Type": "application/json", "RateLimit-Limit": "100", "RateLimit-Remaining": "99" },
    body,
  };
}

function error(status, code, message) {
  return respond(status, { error: { code, message, request_id: requestId() } });
}

const invalid = (message) => error(400, "invalid_request", message);
const notFound = (kind, id) => error(404, "not_found", `No ${kind} with ID ${id} exists.`);

function siteView(site) {
  return { ...site, device_count: db.devices.filter((d) => d.site_id === site.id).length };
}

const clone = (value) => JSON.parse(JSON.stringify(value));

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function paginate(items, query) {
  let limit = 20;
  if (query.limit !== undefined) {
    if (!/^\d+$/.test(query.limit) || +query.limit < 1 || +query.limit > 100) {
      return { error: invalid(`limit must be between 1 and 100. Received: ${query.limit}.`) };
    }
    limit = +query.limit;
  }
  // A cursor points at the first item of the next page: "cursor:<id>",
  // encoded as Base64, the same format as the examples in the docs.
  let start = 0;
  if (query.cursor !== undefined) {
    let decoded = "";
    try {
      decoded = atob(query.cursor);
    } catch {
      decoded = "";
    }
    const match = /^cursor:(.+)$/.exec(decoded);
    start = match ? items.findIndex((item) => item.id === match[1]) : -1;
    if (start < 0) {
      return { error: invalid("cursor isn't valid. Use the next_cursor value from the previous page, with the same filters.") };
    }
  }
  const page = items.slice(start, start + limit);
  const next = start + limit < items.length ? btoa(`cursor:${items[start + limit].id}`).replace(/=+$/, "") : null;
  return { data: page, next_cursor: next };
}

function checkEnum(query, name, values) {
  if (query[name] !== undefined && !values.includes(query[name])) {
    return invalid(`${name} must be one of: ${values.join(", ")}. Received: ${query[name]}.`);
  }
  return null;
}

function list(items, query, filters) {
  for (const [name, values] of Object.entries(filters)) {
    const problem = values && checkEnum(query, name, values);
    if (problem) return problem;
  }
  const filtered = items.filter((item) =>
    Object.keys(filters).every((name) => query[name] === undefined || item[name] === query[name]));
  const page = paginate(filtered, query);
  return page.error || respond(200, clone(page));
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

const DEVICE_TYPES = ["access_point", "gateway"];
const DEVICE_STATUSES = ["online", "offline", "provisioning"];
const SEVERITIES = ["critical", "major", "minor", "info"];
const ALERT_STATUSES = ["open", "acknowledged", "resolved"];

const operations = {
  listSites: ({ query }) => list(db.sites.map(siteView), query, {}),

  createSite: ({ body }) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) return invalid("The request body must be a JSON object.");
    const { name, time_zone: timeZone } = body;
    if (typeof name !== "string" || name.trim() === "") return invalid("name is required.");
    if (name.length > 80) return invalid("name must be 80 characters or fewer.");
    if (typeof timeZone !== "string" || !TIME_ZONE.test(timeZone)) {
      return invalid("time_zone must be a name from the IANA time zone database, such as America/Chicago.");
    }
    if (db.sites.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return error(409, "conflict", `A site named "${name}" already exists.`);
    }
    const site = { id: `site_sbx${db.nextId++}`, name, time_zone: timeZone, created_at: new Date().toISOString().replace(/\.\d+Z$/, "Z") };
    db.sites.push(site);
    return respond(201, siteView(site));
  },

  getSite: ({ params }) => {
    const site = db.sites.find((s) => s.id === params.site_id);
    return site ? respond(200, siteView(site)) : notFound("site", params.site_id);
  },

  listDevices: ({ query }) => list([...db.devices].sort((a, b) => a.name.localeCompare(b.name)), query,
    { site_id: null, type: DEVICE_TYPES, status: DEVICE_STATUSES }),

  getDevice: ({ params }) => {
    const device = db.devices.find((d) => d.id === params.device_id);
    return device ? respond(200, clone(device)) : notFound("device", params.device_id);
  },

  updateDevice: ({ params, body }) => {
    const device = db.devices.find((d) => d.id === params.device_id);
    if (!device) return notFound("device", params.device_id);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length === 0) {
      return invalid("Send at least one field to change: name or radio.");
    }
    const unknown = Object.keys(body).filter((k) => !["name", "radio"].includes(k));
    if (unknown.length) return invalid(`${unknown[0]} can't be changed. You can change name and radio.`);
    if ("name" in body && (typeof body.name !== "string" || body.name.trim() === "" || body.name.length > 60)) {
      return invalid("name must be 1 to 60 characters.");
    }
    if ("radio" in body) {
      if (device.type !== "access_point") return invalid("radio settings apply only to access points.");
      const radio = body.radio;
      if (!radio || typeof radio !== "object" || Array.isArray(radio) || Object.keys(radio).length === 0) {
        return invalid("radio must include channel_bandwidth_mhz, transmit_power_dbm, or both.");
      }
      const badField = Object.keys(radio).find((k) => !["channel_bandwidth_mhz", "transmit_power_dbm"].includes(k));
      if (badField) return invalid(`radio.${badField} can't be changed.`);
      if ("channel_bandwidth_mhz" in radio && ![10, 20, 40].includes(radio.channel_bandwidth_mhz)) {
        return invalid(`radio.channel_bandwidth_mhz must be 10, 20, or 40. Received: ${JSON.stringify(radio.channel_bandwidth_mhz)}.`);
      }
      if ("transmit_power_dbm" in radio) {
        const p = radio.transmit_power_dbm;
        if (!Number.isInteger(p) || p < 0 || p > 30) {
          return invalid(`radio.transmit_power_dbm must be a whole number from 0 to 30. Received: ${JSON.stringify(p)}.`);
        }
      }
    }
    if ("name" in body) device.name = body.name;
    if ("radio" in body) Object.assign(device.radio, body.radio);
    device.last_seen_at = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    return respond(200, clone(device));
  },

  listAlerts: ({ query }) => list([...db.alerts].sort((a, b) => b.created_at.localeCompare(a.created_at)), query,
    { site_id: null, severity: SEVERITIES, status: ALERT_STATUSES }),

  acknowledgeAlert: ({ params, body }) => {
    const alert = db.alerts.find((a) => a.id === params.alert_id);
    if (!alert) return notFound("alert", params.alert_id);
    if (body !== undefined && body !== null) {
      if (typeof body !== "object" || Array.isArray(body)) return invalid("The request body must be a JSON object.");
      if ("note" in body && (typeof body.note !== "string" || body.note.length > 280)) {
        return invalid("note must be text of 280 characters or fewer.");
      }
    }
    if (alert.status === "resolved") {
      return error(409, "conflict", `Alert ${alert.id} is resolved and can't be acknowledged.`);
    }
    if (alert.status === "open") {
      alert.status = "acknowledged";
      alert.acknowledged_at = new Date().toISOString().replace(/\.\d+Z$/, "Z");
      alert.acknowledged_note = body && typeof body.note === "string" ? body.note : null;
    }
    return respond(200, clone(alert));
  },
};

// Each operation's method, path, and whether it changes data.
export const ROUTES = [
  { operationId: "listSites", method: "GET", path: "/sites" },
  { operationId: "createSite", method: "POST", path: "/sites", writes: true },
  { operationId: "getSite", method: "GET", path: "/sites/{site_id}" },
  { operationId: "listDevices", method: "GET", path: "/devices" },
  { operationId: "getDevice", method: "GET", path: "/devices/{device_id}" },
  { operationId: "updateDevice", method: "PATCH", path: "/devices/{device_id}", writes: true },
  { operationId: "listAlerts", method: "GET", path: "/alerts" },
  { operationId: "acknowledgeAlert", method: "POST", path: "/alerts/{alert_id}/acknowledge", writes: true },
];

function match(route, method, path) {
  if (route.method !== method) return null;
  const names = [];
  const pattern = new RegExp("^" + route.path.replace(/\{(\w+)\}/g, (_, n) => { names.push(n); return "([^/]+)"; }) + "$");
  const m = pattern.exec(path);
  if (!m) return null;
  return Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
}

// Handle one request, the way the real API would.
//   method: "GET", "POST", or "PATCH"
//   url:    a path with an optional query string, such as "/devices?status=online"
//   apiKey: the key, without "Bearer"
//   body:   a parsed JSON value, or undefined
export function handle({ method, url, apiKey, body }) {
  const [rawPath, rawQuery = ""] = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/v1(?=\/)/, "").split("?");
  const path = rawPath.replace(/\/+$/, "") || "/";
  const query = Object.fromEntries(new URLSearchParams(rawQuery));

  if (!apiKey) return error(401, "unauthorized", "The API key is missing or invalid.");
  if (apiKey !== SANDBOX_KEYS.readWrite && apiKey !== SANDBOX_KEYS.readOnly) {
    return error(401, "unauthorized", "The API key is missing or invalid.");
  }

  for (const route of ROUTES) {
    const params = match(route, method, path);
    if (!params) continue;
    if (route.writes && apiKey === SANDBOX_KEYS.readOnly) {
      return error(403, "forbidden", "This operation requires a read-write API key.");
    }
    return operations[route.operationId]({ params, query, body });
  }
  return error(404, "not_found", `No operation matches ${method} ${path}.`);
}
