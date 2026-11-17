<!-- Generated from api/openapi.yaml by api/generate_reference.py. Don't edit this page by hand. -->

# Sites reference

A site is one physical location on your network, such as a warehouse or campus. Every device belongs to one site.

Times are in UTC (Coordinated Universal Time), in the format `2026-11-17T18:29:41Z`.

## The site object

A physical location on your network.

| Field | Type | Always present | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | The site's unique ID, which starts with `site_`. |
| `name` | string | Yes | The site's name. Unique in your account. |
| `time_zone` | string | Yes | The site's time zone, as a name from the IANA (Internet Assigned Numbers Authority) time zone database. Relay uses it to schedule maintenance windows. |
| `device_count` | integer | Yes | The number of devices at the site. |
| `created_at` | string | Yes | When the site was created, in UTC. |

## List sites

`GET /sites`

Returns your sites, sorted by creation time, oldest first. Results are paginated.

[Try it in the sandbox](../try-it.md#listSites)

### Query parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `limit` | integer | No | The maximum number of results to return. Valid range: 1 to 100. Default: `20`. |
| `cursor` | string | No | The `next_cursor` value from the previous page. Leave it out to get the first page. |

### Example request

```bash
curl https://api.relay.example/v1/sites \
  -H "Authorization: Bearer $RELAY_API_KEY"
```

### Example response

Status: `200`

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

### Responses

| Status | Meaning |
| --- | --- |
| `200` | A page of sites. |
| `400` | A parameter or field is missing, has the wrong type, or is out of range. The message names the problem. |
| `401` | The API key is missing, malformed, or revoked. |
| `429` | Your API key sent more than 100 requests in one minute. Wait the number of seconds in the `Retry-After` header, then try again. |

## Create a site

`POST /sites`

Creates a site. After you create a site, you can add devices to it
in the Relay console.

Requires a read-write API key.

[Try it in the sandbox](../try-it.md#createSite)

### Request body

Required.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | The site's name. Must be unique in your account. Maximum 80 characters. |
| `time_zone` | string | Yes | The site's time zone, as a name from the IANA (Internet Assigned Numbers Authority) time zone database, such as `America/Chicago`. |

### Example request

```bash
curl -X POST https://api.relay.example/v1/sites \
  -H "Authorization: Bearer $RELAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Fremont assembly plant",
  "time_zone": "America/Los_Angeles"
}'
```

### Example response

Status: `201`

```json
{
  "id": "site_3Rt9wX",
  "name": "Fremont assembly plant",
  "time_zone": "America/Los_Angeles",
  "device_count": 0,
  "created_at": "2026-11-17T18:30:00Z"
}
```

### Responses

| Status | Meaning |
| --- | --- |
| `201` | The site was created. |
| `400` | A parameter or field is missing, has the wrong type, or is out of range. The message names the problem. |
| `401` | The API key is missing, malformed, or revoked. |
| `403` | The API key is read-only, and this operation changes data. |
| `409` | A site with this name already exists. Site names must be unique. |
| `429` | Your API key sent more than 100 requests in one minute. Wait the number of seconds in the `Retry-After` header, then try again. |

## Get a site

`GET /sites/{site_id}`

Returns one site.

[Try it in the sandbox](../try-it.md#getSite)

### Path parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `site_id` | string | Yes | The ID of the site, which starts with `site_`. |

### Example request

```bash
curl https://api.relay.example/v1/sites/site_7Kq2nP \
  -H "Authorization: Bearer $RELAY_API_KEY"
```

### Example response

Status: `200`

```json
{
  "id": "site_7Kq2nP",
  "name": "Oakland distribution center",
  "time_zone": "America/Los_Angeles",
  "device_count": 24,
  "created_at": "2026-09-14T17:02:11Z"
}
```

### Responses

| Status | Meaning |
| --- | --- |
| `200` | The site. |
| `401` | The API key is missing, malformed, or revoked. |
| `404` | No resource with this ID exists in your account. |
| `429` | Your API key sent more than 100 requests in one minute. Wait the number of seconds in the `Retry-After` header, then try again. |
