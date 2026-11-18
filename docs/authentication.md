---
title: Authentication
description: Create a Relay API key, choose read-only or read-write access, send the key with each request, and replace it if it's exposed.
doc_type: how_to
audience: developers who automate network operations
product_version: v1
status: published
last_reviewed: 2026-11-17
questions:
  - How do I create a Relay API key?
  - How do I send my API key with a request?
  - How do I revoke a Relay API key?
  - Should I use a read-only or read-write key?
---

# Authentication

Every request to the Relay API needs an API key. This page explains how to
create a key, which type to choose, and how to keep it secure.

## Choose a key type

| Key type | Can call | Use it for |
| --- | --- | --- |
| Read-only | Every `GET` operation | Dashboards, reports, and monitoring scripts |
| Read-write | Every operation, including those that create or change data | Automation that changes device settings or acknowledges alerts |

Use a read-only key unless your tool needs to change something. If a
read-only key leaks, nothing on your network can be changed with it.

## Create an API key

You create Relay API keys in the Relay console. You need the Administrator
role.

1. In the Relay console, go to **Settings** > **API keys**.
2. Click **Create key**.
3. Enter a name that says what the key is for, such as
   `Grafana dashboard`. The name helps you find the key later if you need
   to revoke it.
4. Select **Read-only** or **Read-write**.
5. Click **Create**.

    The console shows the key once. Copy it now, and store it in a
    password manager or your organization's secrets manager.

!!! warning
    Relay can't show the key again after you close the dialog. If you lose
    it, revoke it and create a new one.

## Send the key with each request

Put the key in the `Authorization` header, after the word `Bearer`:

```bash
curl https://api.relay.example/v1/sites \
  -H "Authorization: Bearer $RELAY_API_KEY"
```

## Keep your key secure

- Store keys in environment variables or a secrets manager. Never put a
  key in source code or a shared document.
- Create a separate key for each tool, so you can revoke one without
  breaking the others.
- Use read-only keys wherever you can.

## Revoke an API key

If a key is exposed, such as in a public repository, revoke it right away.

!!! warning
    Revoking a key can't be undone. Every tool that uses the key stops
    working until you give it a new key.

1. Create a new key of the same type, and update your tool to use it.
2. In the Relay console, go to **Settings** > **API keys**.
3. Next to the exposed key, click **Revoke**, and confirm.

Requests with a revoked key return a `401` error.

## Authentication errors

| Status | Code | Cause | Fix |
| --- | --- | --- | --- |
| `401` | `unauthorized` | The key is missing, malformed, or revoked. | Check that the `Authorization` header starts with `Bearer`, followed by a space and a valid key. |
| `403` | `forbidden` | A read-only key called an operation that changes data. | Use a read-write key for this operation. |
