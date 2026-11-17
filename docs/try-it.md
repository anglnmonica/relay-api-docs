---
title: Try the Relay API
description: Send requests to a Relay API sandbox in your browser, with sample data, and see the responses.
doc_type: how_to
audience: developers who automate network operations
product_version: v1
last_reviewed: 2026-11-17
---

# Try the Relay API

Send requests to a sandbox of the Relay API, right here in your browser.
The sandbox follows the same rules as the [reference](reference/devices.md):
it checks your parameters, rejects read-only keys for changes, and returns
the same errors.

!!! note "How the sandbox works"
    Nothing leaves your browser. The sandbox starts with sample data for two
    sites, five devices, and four alerts. Your changes last until you
    reload the page or select **Reset sandbox data**. The sandbox doesn't
    enforce the rate limit.

## Sandbox API keys

| Key | Access |
| --- | --- |
| `rk_test_readwrite` | Every operation |
| `rk_test_readonly` | Only `GET` operations. Changes return a `403` error. |

## Send a request

1. Choose an operation and an API key.
2. Change the parameters or the request body, if you want.
3. Select **Send request**.

To see an error, try **Update a device** with `transmit_power_dbm` set to
`31`, or any change with the read-only key.

<div id="try-it" class="tryit">Loading the sandbox…</div>

<script type="module" src="../javascripts/try-it.js"></script>
