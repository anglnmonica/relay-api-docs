<!-- Generated from api/openapi.yaml by api/generate_reference.py. Don't edit this page by hand. -->

# Alerts reference

Alerts report problems on your network, such as a device going offline.

Times are in UTC (Coordinated Universal Time), in the format `2026-11-17T18:29:41Z`.

## The alert object

A problem detected on your network.

| Field | Type | Always present | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | The alert's unique ID, which starts with `alt_`. |
| `site_id` | string | Yes | The ID of the site where the problem is. |
| `device_id` | string or null | Yes | The ID of the device with the problem. `null` for alerts about a whole site. |
| `severity` | string, one of `critical`, `major`, `minor`, `info` | Yes | How urgent the alert is:<br>`critical`: service is down for users. Act now.<br>`major`: service is degraded.<br>`minor`: a problem that doesn't affect service yet.<br>`info`: for your records. No action needed. |
| `type` | string, one of `device_offline`, `high_cpu`, `radio_interference`, `certificate_expiring` | Yes | What the alert is about:<br>`device_offline`: a device stopped reporting.<br>`high_cpu`: a device's processor stayed over 90% for 5 minutes.<br>`radio_interference`: an access point detected interference on its channel.<br>`certificate_expiring`: a device certificate expires within 30 days. |
| `message` | string | Yes | A readable description of the problem. |
| `status` | string, one of `open`, `acknowledged`, `resolved` | Yes | Where the alert is in its lifecycle:<br>`open`: the problem is active, and no one has acknowledged it.<br>`acknowledged`: someone is working on it.<br>`resolved`: the problem cleared. Relay resolves alerts automatically. |
| `created_at` | string | Yes | When Relay detected the problem, in UTC. |
| `acknowledged_at` | string or null | Yes | When someone acknowledged the alert, in UTC. `null` if no one has. |
| `acknowledged_note` | string or null | Yes | The note added when the alert was acknowledged. `null` if there's none. |

## List alerts

`GET /alerts`

Returns your alerts, newest first. Use the query parameters to filter by site, severity, or status. Results are paginated.

[Try it in the sandbox](../try-it.md#listAlerts)

### Query parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `site_id` | string | No | Return only alerts at this site. |
| `severity` | string, one of `critical`, `major`, `minor`, `info` | No | Return only alerts with this severity. |
| `status` | string, one of `open`, `acknowledged`, `resolved` | No | Return only alerts with this status. |
| `limit` | integer | No | The maximum number of results to return. Valid range: 1 to 100. Default: `20`. |
| `cursor` | string | No | The `next_cursor` value from the previous page. Leave it out to get the first page. |

### Example request

```bash
curl https://api.relay.example/v1/alerts \
  -H "Authorization: Bearer $RELAY_API_KEY"
```

### Example response

Status: `200`

```json
{
  "data": [
    {
      "id": "alt_Q7m4Zs",
      "site_id": "site_7Kq2nP",
      "device_id": "dev_D4e5F6",
      "severity": "critical",
      "type": "device_offline",
      "message": "Access point \"Mezzanine east\" hasn't responded for 10 minutes.",
      "status": "open",
      "created_at": "2026-11-17T17:55:00Z",
      "acknowledged_at": null,
      "acknowledged_note": null
    }
  ],
  "next_cursor": null
}
```

### Responses

| Status | Meaning |
| --- | --- |
| `200` | A page of alerts. |
| `400` | A parameter or field is missing, has the wrong type, or is out of range. The message names the problem. |
| `401` | The API key is missing, malformed, or revoked. |
| `429` | Your API key sent more than 100 requests in one minute. Wait the number of seconds in the `Retry-After` header, then try again. |

## Acknowledge an alert

`POST /alerts/{alert_id}/acknowledge`

Marks an open alert as acknowledged, to show that someone is working
on it. Acknowledging doesn't fix the problem. The alert resolves on
its own when the problem clears.

Acknowledging an alert that's already acknowledged returns the alert
unchanged. Acknowledging a resolved alert returns a `409` error.

Requires a read-write API key.

[Try it in the sandbox](../try-it.md#acknowledgeAlert)

### Path parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `alert_id` | string | Yes | The ID of the alert, which starts with `alt_`. |

### Request body

Optional.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `note` | string | No | A note for your team, such as who's handling the alert. Maximum 280 characters. |

### Example request

```bash
curl -X POST https://api.relay.example/v1/alerts/alt_Q7m4Zs/acknowledge \
  -H "Authorization: Bearer $RELAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "note": "Technician dispatched to the mezzanine."
}'
```

### Example response

Status: `200`

```json
{
  "id": "alt_Q7m4Zs",
  "site_id": "site_7Kq2nP",
  "device_id": "dev_D4e5F6",
  "severity": "critical",
  "type": "device_offline",
  "message": "Access point \"Mezzanine east\" hasn't responded for 10 minutes.",
  "status": "acknowledged",
  "created_at": "2026-11-17T17:55:00Z",
  "acknowledged_at": "2026-11-17T18:04:12Z",
  "acknowledged_note": "Technician dispatched to the mezzanine."
}
```

### Responses

| Status | Meaning |
| --- | --- |
| `200` | The alert, now acknowledged. |
| `401` | The API key is missing, malformed, or revoked. |
| `403` | The API key is read-only, and this operation changes data. |
| `404` | No resource with this ID exists in your account. |
| `409` | The alert is resolved, so it can't be acknowledged. |
| `429` | Your API key sent more than 100 requests in one minute. Wait the number of seconds in the `Retry-After` header, then try again. |
