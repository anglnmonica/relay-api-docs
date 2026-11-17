---
title: Make your first API call
description: List your Relay sites and the devices at one site, using curl and an API key.
doc_type: how_to
audience: developers who automate network operations
product_version: v1
last_reviewed: 2026-11-17
---

# Make your first API call

This guide shows how to list your Relay sites, and then the devices at one
of them. It takes about five minutes.

## Before you begin

You need:

- A Relay API key. Any key works for this guide, because it only reads
  data. To create one, see [Authentication](authentication.md).
- `curl`, a command-line tool for sending web requests. It's installed on
  macOS, Linux, and Windows 10 and later.

## Store your API key

Save your API key in an environment variable, so you don't paste it into
every command.

=== "macOS and Linux"

    ```bash
    export RELAY_API_KEY="<your API key>"
    ```

=== "Windows PowerShell"

    ```powershell
    $env:RELAY_API_KEY = "<your API key>"
    ```

The variable lasts until you close the terminal window.

## List your sites

1. Send a request to the sites endpoint:

    ```bash
    curl https://api.relay.example/v1/sites \
      -H "Authorization: Bearer $RELAY_API_KEY"
    ```

    The response lists your sites:

    ```json
    {
      "data": [
        {
          "id": "site_7Kq2nP",
          "name": "Oakland distribution center",
          "time_zone": "America/Los_Angeles",
          "device_count": 24,
          "created_at": "2026-09-14T17:02:11Z"
        }
      ],
      "next_cursor": null
    }
    ```

2. Copy the `id` of the site you want to look at, such as `site_7Kq2nP`.

If you get a `401` error instead, the API key is missing or invalid. Check
that you set `RELAY_API_KEY` in the same terminal window.

## List the devices at a site

1. Send a request to the devices endpoint, with the site ID from the
   previous section:

    ```bash
    curl "https://api.relay.example/v1/devices?site_id=site_7Kq2nP" \
      -H "Authorization: Bearer $RELAY_API_KEY"
    ```

    The response lists the site's devices, with each device's status. For
    access points, it also includes the radio settings:

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

2. If `next_cursor` isn't `null`, the site has more devices than fit on
   one page. To get the next page, see
   [Pagination and rate limits](pagination-and-rate-limits.md).

## Next steps

- [Reduce interference between access points](guides/reduce-interference.md),
  a complete task that uses alerts and device settings.
- [Devices reference](reference/devices.md), for every field and filter.
