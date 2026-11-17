---
title: Reduce interference between access points
description: Find radio interference alerts, lower an access point's transmit power during a maintenance window, and confirm the alert resolves.
doc_type: how_to
audience: developers who automate network operations
product_version: v1
last_reviewed: 2026-11-17
---

# Reduce interference between access points

When two access points at a site cover the same area on the same channel,
each one's signal interferes with the other's. Devices in that area see
slower data and dropped connections. Relay reports this with a
`radio_interference` alert.

One fix is to lower the transmit power of one of the access points, so its
coverage area shrinks. This guide shows how to find the alert, change the
access point's transmit power, and confirm the fix worked.

## Before you begin

- You need a read-write API key. See [Authentication](../authentication.md).
- Plan a maintenance window. **Changing radio settings restarts the access
  point's radio.** Devices connected to it disconnect for about 30 seconds,
  and then reconnect.
- Set the `RELAY_API_KEY` environment variable, as shown in
  [Make your first API call](../quickstart.md).

## Find interference alerts

1. List the open alerts at the site:

    ```bash
    curl "https://api.relay.example/v1/alerts?site_id=site_7Kq2nP&status=open" \
      -H "Authorization: Bearer $RELAY_API_KEY"
    ```

2. In the response, find alerts where `type` is `radio_interference`, and
   note each alert's `id` and `device_id`.

    ```json
    {
      "id": "alt_N3v8Hq",
      "site_id": "site_7Kq2nP",
      "device_id": "dev_A1b2C3",
      "severity": "major",
      "type": "radio_interference",
      "message": "Access point \"Dock door 4\" detected interference on its channel.",
      "status": "open",
      "created_at": "2026-11-17T16:40:00Z",
      "acknowledged_at": null,
      "acknowledged_note": null
    }
    ```

## Acknowledge the alert

Acknowledging the alert shows your team that someone is handling it. It
doesn't change the network.

```bash
curl -X POST https://api.relay.example/v1/alerts/alt_N3v8Hq/acknowledge \
  -H "Authorization: Bearer $RELAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"note": "Lowering transmit power on Dock door 4 tonight."}'
```

The response shows the alert with `status` set to `acknowledged`.

## Lower the transmit power

1. Check the access point's current setting:

    ```bash
    curl https://api.relay.example/v1/devices/dev_A1b2C3 \
      -H "Authorization: Bearer $RELAY_API_KEY"
    ```

    Note the value of `radio.transmit_power_dbm`. The default is 23 dBm.

2. During your maintenance window, lower the transmit power. Start with a
   small change, such as 3 dB lower:

    ```bash
    curl -X PATCH https://api.relay.example/v1/devices/dev_A1b2C3 \
      -H "Authorization: Bearer $RELAY_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"radio": {"transmit_power_dbm": 20}}'
    ```

    The response shows the device with the new value. The access point's
    radio restarts, and connected devices reconnect within about 30
    seconds.

    The valid range is 0 to 30 dBm. A value outside the range returns a
    `400` error, and the setting doesn't change.

## Confirm the fix

Relay resolves the alert on its own when the interference clears.

1. List the alert's site again, filtered to resolved alerts:

    ```bash
    curl "https://api.relay.example/v1/alerts?site_id=site_7Kq2nP&status=resolved" \
      -H "Authorization: Bearer $RELAY_API_KEY"
    ```

2. Check that the alert's `status` is `resolved`.

If the alert stays open, lower the power by another 3 dB, or ask your RF
(radio frequency) team to review the site's channel plan. Lowering the
power too far can leave gaps in coverage.

## Related

- [Devices reference: Update a device](../reference/devices.md#update-a-device)
- [Alerts reference](../reference/alerts.md)
