---
title: Relay API release notes
description: Changes to the Relay API, newest first.
doc_type: release_notes
audience: developers who automate network operations
product_version: v1
release_date: 2026-11-17
status: published
last_reviewed: 2026-11-17
questions:
  - What changed in Relay API version 1.0.0?
  - What are the known issues in the Relay API?
---

# Relay API release notes

## Version 1.0.0

Released on November 17, 2026.

### Highlights

The first version of the Relay API. You can manage sites, devices, and
alerts from your own tools.

### New features

- **Sites:** list your sites, get one site, and create sites.
- **Devices:** list devices, with filters for site, type, and status, and
  get one device. You can also change a device's name and an access
  point's radio settings.
- **Alerts:** list alerts, with filters for site, severity, and status, and
  acknowledge them.
- **API keys:** create read-only and read-write keys in the Relay console.

### Known issues

| Issue | Workaround |
| --- | --- |
| Relay doesn't send webhooks yet, so your tools learn about new alerts only by checking. | Check for open alerts every few minutes, and stay within the [rate limit](pagination-and-rate-limits.md). |
