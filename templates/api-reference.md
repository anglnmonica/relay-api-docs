---
title: "<API name> API reference"
description: "<One sentence: what developers can do with this API.>"
doc_type: api_reference
audience: "<developers | integration engineers | ...>"
api_version: "<v1>"
last_reviewed: "<YYYY-MM-DD>"
---

<!--
  API reference template.
  Use it for: the overview page of a REST API, and for endpoint pages when
  you can't generate them from an OpenAPI spec.
  If you have an OpenAPI spec, generate the endpoint pages from it, and use
  this template for the overview sections only. A spec and a hand-written
  page that disagree are worse than either one alone.
  The reader: a developer who needs exact values. Never round, guess, or
  paraphrase a field name, type, or limit.
  Replace every <...> placeholder, and delete these comments when you're done.
-->

The <API name> API lets you <main tasks, such as "list devices, change their
settings, and read their alerts">.

## Base URL

```
https://<api.example.com>/<v1>
```

## Authentication

<How to get credentials, and how to send them.> Send your API key in the
`<Authorization>` header of every request:

```bash
curl https://<api.example.com>/<v1>/<resource> \
  -H "Authorization: Bearer $API_KEY"
```

<!-- Say where keys come from, which permissions they need, and how long they last. -->

## Errors

Errors return a JSON body in this format:

```json
{
  "error": {
    "code": "<error_code>",
    "message": "<Readable description.>"
  }
}
```

| HTTP status | Code | Meaning | What to do |
| --- | --- | --- | --- |
| 400 | `<invalid_request>` | <A parameter is missing or has the wrong format.> | <Check the request against this reference.> |
| 401 | `<unauthorized>` | <The API key is missing or invalid.> | <Check the Authorization header.> |
| 404 | `<not_found>` | <The resource doesn't exist.> | <Check the ID.> |
| 429 | `<rate_limited>` | <Too many requests.> | <Wait the number of seconds in the Retry-After header.> |

## Rate limits

<The limit, such as 100 requests per minute for each API key, and which
response headers show the remaining quota.>

## Pagination

<How list endpoints return results in pages, such as the `limit` and
`cursor` parameters.>

<!-- Copy this section for each endpoint. Title it with a verb and the
     resource, such as "List devices". -->

## <Verb> <resource>

`<GET>` `/<resource>`

<One sentence on what this endpoint does and when to use it.>

### Path parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `<id>` | string | Yes | <Description.> |

### Query parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `<limit>` | integer | No | <20> | <Description, including the allowed range.> |

### Request body

<For POST, PUT, and PATCH. Delete this section for GET and DELETE.>

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `<name>` | string | Yes | <Description.> |

### Example request

```bash
curl https://<api.example.com>/<v1>/<resource> \
  -H "Authorization: Bearer $API_KEY"
```

### Example response

```json
{
  "<field>": "<value>"
}
```

### Errors

<Errors specific to this endpoint, beyond those in [Errors](#errors).>
