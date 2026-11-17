// Contract tests for the Try it sandbox.
//
// Sends requests to the sandbox in docs/javascripts/sandbox.js and checks
// that each response:
//   1. Has the status the test expects.
//   2. Has a status that api/openapi.yaml documents for that operation.
//   3. Has a body that matches the spec's schema for that status.
//
// If the spec and the sandbox disagree, this test fails, so the Try it page
// can't drift from the docs.
//
// Run from the repository root:
//   npm install --no-save --prefix api ajv@8 ajv-formats@3 yaml@2
//   node api/sandbox-contract-test.mjs

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { handle, resetSandbox, ROUTES, SANDBOX_KEYS } from "../docs/javascripts/sandbox.js";

const require = createRequire(new URL("./", import.meta.url));
const Ajv2020 = require("ajv/dist/2020").default;
const addFormats = require("ajv-formats").default;
const YAML = require("yaml");

const spec = YAML.parse(readFileSync(new URL("./openapi.yaml", import.meta.url), "utf8"));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema({ $id: "relay", components: spec.components });

const RW = SANDBOX_KEYS.readWrite;
const RO = SANDBOX_KEYS.readOnly;

function resolve(node) {
  while (node && node.$ref) {
    node = node.$ref.replace("#/", "").split("/").reduce((obj, key) => obj[key], spec);
  }
  return node;
}

// Rewrite local $refs so Ajv resolves them against the "relay" schema.
function withSchemaIds(schema) {
  return JSON.parse(JSON.stringify(schema).replaceAll('"$ref":"#/', '"$ref":"relay#/'));
}

function operationFor(operationId) {
  const route = ROUTES.find((r) => r.operationId === operationId);
  return { route, op: spec.paths[route.path][route.method.toLowerCase()] };
}

let failures = 0;
let passed = 0;

function check(name, operationId, request, expectedStatus) {
  const { route, op } = operationFor(operationId);
  const response = handle({ method: route.method, ...request });
  const problems = [];

  if (response.status !== expectedStatus) {
    problems.push(`expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(response.body)}`);
  }
  const documented = op.responses[String(response.status)];
  if (!documented) {
    problems.push(`status ${response.status} isn't documented for ${operationId}`);
  } else {
    const schema = resolve(documented).content?.["application/json"]?.schema;
    const validate = ajv.compile(withSchemaIds(schema));
    if (!validate(response.body)) {
      problems.push(`body doesn't match the spec: ${ajv.errorsText(validate.errors)}`);
    }
  }

  if (problems.length) {
    failures += 1;
    console.log(`FAIL  ${name}\n      ${problems.join("\n      ")}`);
  } else {
    passed += 1;
    console.log(`pass  ${name}`);
  }
  return response;
}

// Sites
check("List sites", "listSites", { url: "/sites", apiKey: RW }, 200);
check("List sites, 1 per page", "listSites", { url: "/sites?limit=1", apiKey: RO }, 200);
check("List sites with limit 500", "listSites", { url: "/sites?limit=500", apiKey: RW }, 400);
check("List sites with a cursor that doesn't exist", "listSites", { url: "/sites?cursor=bm9wZQ", apiKey: RW }, 400);
check("List sites with no API key", "listSites", { url: "/sites", apiKey: "" }, 401);
check("List sites with an unknown API key", "listSites", { url: "/sites", apiKey: "rk_live_wrong" }, 401);
check("Create a site", "createSite", { url: "/sites", apiKey: RW, body: { name: "Fremont assembly plant", time_zone: "America/Los_Angeles" } }, 201);
check("Create a site with a name that's taken", "createSite", { url: "/sites", apiKey: RW, body: { name: "Fremont assembly plant", time_zone: "America/Los_Angeles" } }, 409);
check("Create a site without a name", "createSite", { url: "/sites", apiKey: RW, body: { time_zone: "America/Los_Angeles" } }, 400);
check("Create a site with a read-only key", "createSite", { url: "/sites", apiKey: RO, body: { name: "Reno", time_zone: "America/Los_Angeles" } }, 403);
check("Get a site", "getSite", { url: "/sites/site_7Kq2nP", apiKey: RO }, 200);
check("Get a site that doesn't exist", "getSite", { url: "/sites/site_nope", apiKey: RO }, 404);

// Devices
check("List devices", "listDevices", { url: "/devices", apiKey: RO }, 200);
check("List online access points at one site", "listDevices", { url: "/devices?site_id=site_7Kq2nP&type=access_point&status=online", apiKey: RO }, 200);
check("List devices with an unknown status", "listDevices", { url: "/devices?status=broken", apiKey: RO }, 400);
check("List devices with the cursor from the docs", "listDevices", { url: "/devices?cursor=Y3Vyc29yOmRldl9BMWIyQzM", apiKey: RO }, 200);
const page1 = check("List devices, 2 per page", "listDevices", { url: "/devices?limit=2", apiKey: RO }, 200);
check("List devices, next page", "listDevices", { url: `/devices?limit=2&cursor=${page1.body.next_cursor}`, apiKey: RO }, 200);
check("Get an access point", "getDevice", { url: "/devices/dev_A1b2C3", apiKey: RO }, 200);
check("Get a gateway", "getDevice", { url: "/devices/dev_G7h8J9", apiKey: RO }, 200);
check("Get a device that doesn't exist", "getDevice", { url: "/devices/dev_Z9y8X7", apiKey: RO }, 404);
check("Lower an access point's transmit power", "updateDevice", { url: "/devices/dev_A1b2C3", apiKey: RW, body: { radio: { transmit_power_dbm: 20 } } }, 200);
check("Rename a gateway", "updateDevice", { url: "/devices/dev_G7h8J9", apiKey: RW, body: { name: "Core gateway, rack 2" } }, 200);
check("Change a gateway's radio", "updateDevice", { url: "/devices/dev_G7h8J9", apiKey: RW, body: { radio: { transmit_power_dbm: 20 } } }, 400);
check("Set transmit power to 31 dBm", "updateDevice", { url: "/devices/dev_A1b2C3", apiKey: RW, body: { radio: { transmit_power_dbm: 31 } } }, 400);
check("Set channel bandwidth to 30 MHz", "updateDevice", { url: "/devices/dev_A1b2C3", apiKey: RW, body: { radio: { channel_bandwidth_mhz: 30 } } }, 400);
check("Update a device with an empty body", "updateDevice", { url: "/devices/dev_A1b2C3", apiKey: RW, body: {} }, 400);
check("Update a device with a read-only key", "updateDevice", { url: "/devices/dev_A1b2C3", apiKey: RO, body: { name: "Dock 4" } }, 403);
check("Update a device that doesn't exist", "updateDevice", { url: "/devices/dev_Z9y8X7", apiKey: RW, body: { name: "Dock 4" } }, 404);

// Alerts
check("List alerts", "listAlerts", { url: "/alerts", apiKey: RO }, 200);
check("List open critical alerts", "listAlerts", { url: "/alerts?severity=critical&status=open", apiKey: RO }, 200);
check("List alerts with an unknown severity", "listAlerts", { url: "/alerts?severity=urgent", apiKey: RO }, 400);
check("Acknowledge an open alert", "acknowledgeAlert", { url: "/alerts/alt_N3v8Hq/acknowledge", apiKey: RW, body: { note: "Lowering transmit power tonight." } }, 200);
check("Acknowledge it again", "acknowledgeAlert", { url: "/alerts/alt_N3v8Hq/acknowledge", apiKey: RW }, 200);
check("Acknowledge a resolved alert", "acknowledgeAlert", { url: "/alerts/alt_T9y1Ux/acknowledge", apiKey: RW }, 409);
check("Acknowledge with a read-only key", "acknowledgeAlert", { url: "/alerts/alt_Q7m4Zs/acknowledge", apiKey: RO }, 403);
check("Acknowledge an alert that doesn't exist", "acknowledgeAlert", { url: "/alerts/alt_nope/acknowledge", apiKey: RW }, 404);

// Every operation in the spec has a sandbox route, and the other way around.
const specOps = Object.values(spec.paths).flatMap((item) => Object.values(item).map((op) => op.operationId)).sort();
const sandboxOps = ROUTES.map((r) => r.operationId).sort();
if (JSON.stringify(specOps) !== JSON.stringify(sandboxOps)) {
  failures += 1;
  console.log(`FAIL  The sandbox and the spec have different operations.\n      Spec: ${specOps}\n      Sandbox: ${sandboxOps}`);
} else {
  passed += 1;
  console.log("pass  The sandbox implements every operation in the spec");
}

resetSandbox();
console.log(`\n${passed} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
