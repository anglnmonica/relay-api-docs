---
title: Devices reference
description: Devices are the access points and gateways installed at your sites. This reference lists the devices endpoints, their parameters, and their responses.
last_reviewed: '2026-11-17'
questions:
- How do I list devices with the Relay API?
- How do I get a device with the Relay API?
- How do I update a device with the Relay API?
---

<!-- Generated from api/openapi.yaml by api/generate_reference.py. Don't edit this page by hand. -->

# Devices reference

Devices are the access points and gateways installed at your sites.

Times are in UTC (Coordinated Universal Time), in the format `2026-11-17T18:29:41Z`.

## The device object

An access point or gateway installed at a site.

| Field | Type | Always present | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | The device's unique ID, which starts with `dev_`. |
| `site_id` | string | Yes | The ID of the site where the device is installed. |
| `name` | string | Yes | The device's name, such as its location in the building. |
| `type` | string, one of `access_point`, `gateway` | Yes | The kind of device:<br>`access_point`: a radio that connects user devices to the network.<br>`gateway`: connects a site to the Relay cloud. |
| `model` | string | Yes | The device's model number. |
| `serial_number` | string | Yes | The serial number printed on the device's label. |
| `status` | string, one of `online`, `offline`, `provisioning` | Yes | The device's connection to Relay:<br>`online`: connected and reporting.<br>`offline`: hasn't reported for 10 minutes or more.<br>`provisioning`: added, but not yet connected for the first time. |
| `firmware_version` | string | Yes | The firmware version the device is running. |
| `radio` | object | No | An access point's radio settings. Changing them restarts the radio, which disconnects connected devices for about 30 seconds. |
| `radio.band` | string | No | The frequency band the radio uses, as a 3GPP band name. Set by the device model. Read-only. |
| `radio.channel_bandwidth_mhz` | integer, one of `10`, `20`, `40` | No | The channel bandwidth, in MHz. Wider channels carry more data, but need more free spectrum. Default: `20`. |
| `radio.transmit_power_dbm` | integer | No | The transmit power, in dBm. Lower power shrinks the coverage area and reduces interference with nearby access points. Valid range: 0 to 30. Default: `23`. |
| `last_seen_at` | string or null | Yes | When the device last reported to Relay, in UTC. `null` if it hasn't connected yet. |

## List devices

`GET /devices`

Returns your devices, sorted by name. Use the query parameters to filter by site, type, or status. Results are paginated.

[Try it in the sandbox](../try-it.md#listDevices)

### Query parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `site_id` | string | No | Return only devices at this site. |
| `type` | string, one of `access_point`, `gateway` | No | Return only devices of this type. |
| `status` | string, one of `online`, `offline`, `provisioning` | No | Return only devices with this status. |
| `limit` | integer | No | The maximum number of results to return. Valid range: 1 to 100. Default: `20`. |
| `cursor` | string | No | The `next_cursor` value from the previous page. Leave it out to get the first page. |

### Example request

```bash
curl https://api.relay.example/v1/devices \
  -H "Authorization: Bearer $RELAY_API_KEY"
```

### Example response

Status: `200`

```json
{
  "data": [
    {
      "id": "dev_A1b2C3",
      "site_id": "site_7Kq2nP",
      "name": "Dock door 4",
      "type": "access_point",
      "model": "RL-AP200",
      "serial_number": "RLA2006Q4K19",
      "status": "online",
      "firmware_version": "4.2.1",
      "radio": {
        "band": "n48",
        "channel_bandwidth_mhz": 20,
        "transmit_power_dbm": 23
      },
      "last_seen_at": "2026-11-17T18:29:41Z"
    }
  ],
  "next_cursor": "Y3Vyc29yOmRldl9BMWIyQzM"
}
```

### Responses

| Status | Meaning |
| --- | --- |
| `200` | A page of devices. |
| `400` | A parameter or field is missing, has the wrong type, or is out of range. The message names the problem. |
| `401` | The API key is missing, malformed, or revoked. |
| `429` | Your API key sent more than 100 requests in one minute. Wait the number of seconds in the `Retry-After` header, then try again. |

## Get a device

`GET /devices/{device_id}`

Returns one device, including its radio settings if it's an access point.

[Try it in the sandbox](../try-it.md#getDevice)

### Path parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `device_id` | string | Yes | The ID of the device, which starts with `dev_`. |

### Example request

```bash
curl https://api.relay.example/v1/devices/dev_A1b2C3 \
  -H "Authorization: Bearer $RELAY_API_KEY"
```

### Example response

Status: `200`

```json
{
  "id": "dev_A1b2C3",
  "site_id": "site_7Kq2nP",
  "name": "Dock door 4",
  "type": "access_point",
  "model": "RL-AP200",
  "serial_number": "RLA2006Q4K19",
  "status": "online",
  "firmware_version": "4.2.1",
  "radio": {
    "band": "n48",
    "channel_bandwidth_mhz": 20,
    "transmit_power_dbm": 23
  },
  "last_seen_at": "2026-11-17T18:29:41Z"
}
```

### Responses

| Status | Meaning |
| --- | --- |
| `200` | The device. |
| `401` | The API key is missing, malformed, or revoked. |
| `404` | No resource with this ID exists in your account. |
| `429` | Your API key sent more than 100 requests in one minute. Wait the number of seconds in the `Retry-After` header, then try again. |

## Update a device

`PATCH /devices/{device_id}`

Changes a device's name or radio settings. Send only the fields you
want to change.

**Changing radio settings restarts the access point's radio.** Devices
connected to that access point disconnect for about 30 seconds and
then reconnect. Schedule radio changes for a maintenance window.

Radio settings apply only to access points. Sending `radio` for a
gateway returns a `400` error.

Requires a read-write API key.

[Try it in the sandbox](../try-it.md#updateDevice)

### Path parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `device_id` | string | Yes | The ID of the device, which starts with `dev_`. |

### Request body

Required.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | No | A new name for the device. Maximum 60 characters. |
| `radio` | object | No | New radio settings. Access points only. Changing them restarts the radio. |
| `radio.channel_bandwidth_mhz` | integer, one of `10`, `20`, `40` | No | The channel bandwidth, in MHz. |
| `radio.transmit_power_dbm` | integer | No | The transmit power, in dBm. Valid range: 0 to 30. |

### Example request

```bash
curl -X PATCH https://api.relay.example/v1/devices/dev_A1b2C3 \
  -H "Authorization: Bearer $RELAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "radio": {
    "transmit_power_dbm": 20
  }
}'
```

### Example response

Status: `200`

```json
{
  "id": "dev_A1b2C3",
  "site_id": "site_7Kq2nP",
  "name": "Dock door 4",
  "type": "access_point",
  "model": "RL-AP200",
  "serial_number": "RLA2006Q4K19",
  "status": "online",
  "firmware_version": "4.2.1",
  "radio": {
    "band": "n48",
    "channel_bandwidth_mhz": 20,
    "transmit_power_dbm": 20
  },
  "last_seen_at": "2026-11-17T18:31:02Z"
}
```

### Responses

| Status | Meaning |
| --- | --- |
| `200` | The device, with the changes applied. |
| `400` | A parameter or field is missing, has the wrong type, or is out of range. The message names the problem. |
| `401` | The API key is missing, malformed, or revoked. |
| `403` | The API key is read-only, and this operation changes data. |
| `404` | No resource with this ID exists in your account. |
| `429` | Your API key sent more than 100 requests in one minute. Wait the number of seconds in the `Retry-After` header, then try again. |
