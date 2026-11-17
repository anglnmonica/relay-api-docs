---
title: Relay API overview
description: The Relay API lets you manage the sites, devices, and alerts on a Relay private network from your own tools.
doc_type: api_reference
audience: developers who automate network operations
api_version: v1
last_reviewed: 2026-11-17
---

# Relay API overview

!!! note "Relay is fictional"
    Relay and its API were created to demonstrate API documentation. The
    `relay.example` domain doesn't exist, so the example requests on this
    site don't return real data.

The Relay API lets you manage a Relay private wireless network from your
own tools. With it, you can:

- List your sites, and create new ones.
- Check the status of your access points and gateways, and change their
  names and radio settings.
- Find open alerts, and acknowledge them so your team knows someone is
  working on them.

## How Relay organizes your network

| Object | Description | Reference |
| --- | --- | --- |
| Site | One physical location, such as a warehouse or campus. | [Sites](reference/sites.md) |
| Device | An access point or gateway installed at a site. Every device belongs to one site. | [Devices](reference/devices.md) |
| Alert | A problem Relay detected at a site or on a device, such as a device going offline. | [Alerts](reference/alerts.md) |

## Base URL

Send every request to this base URL, followed by the path for the
operation:

```text
https://api.relay.example/v1
```

The Relay API accepts and returns JSON (JavaScript Object Notation). It
uses standard HTTP (Hypertext Transfer Protocol) status codes to report
whether a request worked.

## Start here

1. [Make your first API call](quickstart.md): list your sites and devices
   in about five minutes.
2. [Authentication](authentication.md): create an API key with the right
   access, and keep it secure.
3. [Try the API](try-it.md): send requests to a sandbox in your browser,
   with sample data.
4. [Reduce interference between access points](guides/reduce-interference.md):
   a complete task, from finding an alert to changing radio settings.

## For AI tools

The [OpenAPI specification](openapi.md) describes every operation,
parameter, and field in a format that code generators and AI assistants
can read.
