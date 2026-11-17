---
title: Pagination and rate limits
description: Get every page of a list, and stay within the Relay API's rate limit of 100 requests per minute.
doc_type: api_reference
audience: developers who automate network operations
api_version: v1
last_reviewed: 2026-11-17
---

# Pagination and rate limits

## Get every page of a list

Operations that return a list, such as [List devices](reference/devices.md#list-devices),
return one page at a time. Each response includes:

| Field | Description |
| --- | --- |
| `data` | The results on this page. |
| `next_cursor` | A value that points to the next page, or `null` on the last page. |

To get every result:

1. Send the request without a `cursor`. To get more results per page, add
   `limit`, up to 100. The default is 20.
2. If `next_cursor` isn't `null`, send the same request again, with
   `cursor` set to that value:

    ```bash
    curl "https://api.relay.example/v1/devices?limit=100&cursor=Y3Vyc29yOmRldl9BMWIyQzM" \
      -H "Authorization: Bearer $RELAY_API_KEY"
    ```

3. Repeat until `next_cursor` is `null`.

Keep every other parameter the same from page to page. Cursors are
specific to the filters they came from.

## Stay within the rate limit

Each API key can send 100 requests per minute. Every response includes two
headers that show where you stand:

| Header | Description |
| --- | --- |
| `RateLimit-Limit` | The number of requests your key can send each minute. |
| `RateLimit-Remaining` | The number of requests your key has left this minute. |

If you go over the limit, the API returns a `429` error with a
`Retry-After` header. Wait that many seconds, and then send the request
again.

To stay under the limit:

- Use `limit=100` to get more results in each request.
- Use filters, such as `site_id` and `status`, instead of getting every
  result and filtering it yourself.
- Give each tool its own API key, so one busy tool doesn't use up the limit
  for the others.
