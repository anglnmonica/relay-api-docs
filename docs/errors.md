---
title: Errors
description: The format of Relay API errors, what each error code means, and which errors are safe to retry.
doc_type: api_reference
audience: developers who automate network operations
api_version: v1
status: published
last_reviewed: 2026-11-17
questions:
  - What does a Relay API error look like?
  - Which Relay API errors are safe to retry?
---

# Errors

When a request fails, the Relay API returns an HTTP (Hypertext Transfer
Protocol) error status and a JSON (JavaScript Object Notation) body in this
format:

```json
{
  "error": {
    "code": "not_found",
    "message": "No device with ID dev_Z9y8X7 exists.",
    "request_id": "req_4Lm6Np"
  }
}
```

| Field | Description |
| --- | --- |
| `code` | A code your program can check. Codes don't change between releases. |
| `message` | A readable description. It can change, so don't parse it in your code. |
| `request_id` | The request's ID. Include it when you contact support. |

## Error codes

| Status | Code | Meaning | Safe to retry? |
| --- | --- | --- | --- |
| `400` | `invalid_request` | A parameter or field is missing, has the wrong type, or is out of range. The message names the problem. | No. Fix the request first. |
| `401` | `unauthorized` | The API key is missing, malformed, or revoked. | No. See [Authentication](authentication.md). |
| `403` | `forbidden` | A read-only key called an operation that changes data. | No. Use a read-write key. |
| `404` | `not_found` | No resource with this ID exists in your account. | No. Check the ID. |
| `409` | `conflict` | The request conflicts with the resource's current state, such as acknowledging a resolved alert, or creating a site with a name that's already taken. | No. |
| `429` | `rate_limited` | Your API key sent more than 100 requests in one minute. | Yes, after the number of seconds in the `Retry-After` header. |
| `500` | `internal_error` | Something went wrong on Relay's side. | Yes, after a short wait. If it continues, contact support with the `request_id`. |

## Retry safely

Retry only the errors marked safe in the table. For `500` errors, wait
before each retry, and double the wait each time, such as 1, 2, then 4
seconds. Stop after a few tries.
