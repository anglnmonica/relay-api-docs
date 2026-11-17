#!/usr/bin/env python3
"""Generate the API reference pages from the OpenAPI spec.

Run from the repository root:

    python3 api/generate_reference.py

It writes one Markdown page per tag in api/openapi.yaml, such as
docs/reference/devices.md. Don't edit those pages by hand: change the spec,
then run this script again.

To check that the pages match the spec, without changing them:

    python3 api/generate_reference.py --check

The pages are static Markdown, not a JavaScript widget, so search engines,
AI tools, and the style check can all read them.
"""

import json
import sys
from pathlib import Path

import yaml

SPEC = Path("api/openapi.yaml")
OUT = Path("docs/reference")
METHODS = ["get", "post", "put", "patch", "delete"]
HEADER = ("<!-- Generated from api/openapi.yaml by api/generate_reference.py. "
          "Don't edit this page by hand. -->\n")

spec = yaml.safe_load(SPEC.read_text())
base_url = spec["servers"][0]["url"]


def resolve(node):
    """Follow a $ref to the object it points to."""
    while isinstance(node, dict) and "$ref" in node:
        target = spec
        for part in node["$ref"].lstrip("#/").split("/"):
            target = target[part]
        node = target
    return node


def ref_name(node):
    return node["$ref"].split("/")[-1] if isinstance(node, dict) and "$ref" in node else None


def type_text(schema):
    """Describe a schema's type in a few words, such as 'string or null'."""
    s = resolve(schema)
    kind = s.get("type", "object")
    if isinstance(kind, list):
        kind = " or ".join(kind)
    if s.get("type") == "array":
        item = s.get("items", {})
        kind = f"array of {ref_name(item) or type_text(item)} objects" if ref_name(item) else f"array of {type_text(item)}"
    if "enum" in s:
        kind += ", one of " + ", ".join(f"`{v}`" for v in s["enum"])
    return kind


def limits_text(schema):
    """Range, length, and default, as a sentence to add to a description."""
    s = resolve(schema)
    parts = []
    if "minimum" in s and "maximum" in s:
        parts.append(f"Valid range: {s['minimum']} to {s['maximum']}.")
    if "default" in s:
        parts.append(f"Default: `{s['default']}`.")
    if s.get("readOnly"):
        parts.append("Read-only.")
    return " ".join(parts)


def cell(text):
    """Make text safe for one Markdown table cell."""
    return " ".join(str(text).split()).replace("|", "\\|")


def description_text(node, limits_from=None):
    """A description for one table cell, followed by any limits."""
    s = resolve(node)
    text = node.get("description") if isinstance(node, dict) and "description" in node else s.get("description", "")
    lines = [line.strip() for line in (text or "").strip().split("\n") if line.strip()]
    if len(lines) > 1 and lines[1].startswith("- "):
        # A bulleted list of values: keep each value on its own line in the cell.
        text = "<br>".join([cell(lines[0])] + [cell(line[2:]) for line in lines[1:]])
    else:
        text = cell(text)
    return " ".join(filter(None, [text, limits_text(limits_from or node)]))


def field_rows(schema, prefix="", required=()):
    """Table rows for a schema's properties, including nested objects."""
    s = resolve(schema)
    rows = []
    for name, prop in (s.get("properties") or {}).items():
        full = f"{prefix}{name}"
        resolved = resolve(prop)
        rows.append(f"| `{full}` | {type_text(prop)} | {'Yes' if name in required else 'No'} | {description_text(prop)} |")
        if resolved.get("type") == "object" and resolved.get("properties"):
            rows += field_rows(resolved, f"{full}.", resolved.get("required", ()))
    return rows


def fields_table(schema):
    s = resolve(schema)
    header = "| Field | Type | Always present | Description |\n| --- | --- | --- | --- |"
    return header + "\n" + "\n".join(field_rows(s, required=s.get("required", ())))


def request_table(schema):
    s = resolve(schema)
    header = "| Field | Type | Required | Description |\n| --- | --- | --- | --- |"
    return header + "\n" + "\n".join(field_rows(s, required=s.get("required", ())))


def params_table(params):
    header = "| Name | Type | Required | Description |\n| --- | --- | --- | --- |"
    rows = [f"| `{p['name']}` | {type_text(p['schema'])} | {'Yes' if p.get('required') else 'No'} | {description_text(p, p['schema'])} |"
            for p in params]
    return header + "\n" + "\n".join(rows)


def example_value(schema):
    s = resolve(schema)
    examples = s.get("examples")
    return examples[0] if examples else f"<{s.get('type', 'value')}>"


def curl(method, path, params, body):
    url = path
    for p in params:
        if p["in"] == "path":
            url = url.replace("{" + p["name"] + "}", str(example_value(p["schema"])))
    lines = [f"curl {'-X ' + method.upper() + ' ' if method != 'get' else ''}{base_url}{url} \\",
             '  -H "Authorization: Bearer $RELAY_API_KEY"']
    if body is not None:
        lines[-1] += " \\"
        lines.append('  -H "Content-Type: application/json" \\')
        payload = json.dumps(body, indent=2).replace("'", "'\\''")
        lines.append(f"  -d '{payload}'")
    return "\n".join(lines)


def operation_section(path, method, op):
    params = [resolve(p) for p in op.get("parameters", [])]
    out = [f"## {op['summary']}", "", f"`{method.upper()} {path}`", "", op["description"].strip(), ""]

    path_params = [p for p in params if p["in"] == "path"]
    query_params = [p for p in params if p["in"] == "query"]
    if path_params:
        out += ["### Path parameters", "", params_table(path_params), ""]
    if query_params:
        out += ["### Query parameters", "", params_table(query_params), ""]

    body = None
    if "requestBody" in op:
        content = op["requestBody"]["content"]["application/json"]
        body = content.get("example")
        required = "Required." if op["requestBody"].get("required") else "Optional."
        out += ["### Request body", "", required, "", request_table(content["schema"]), ""]

    out += ["### Example request", "", "```bash", curl(method, path, params, body), "```", ""]

    success = next(code for code in op["responses"] if code.startswith("2"))
    response = resolve(op["responses"][success])
    example = response["content"]["application/json"].get("example")
    out += ["### Example response", "", f"Status: `{success}`", "", "```json",
            json.dumps(example, indent=2), "```", ""]

    out += ["### Responses", "", "| Status | Meaning |", "| --- | --- |"]
    for code, resp in op["responses"].items():
        out.append(f"| `{code}` | {cell(resolve(resp)['description'])} |")
    out.append("")
    return out


def objects_for_tag(tag):
    """The main object each tag's operations return, such as Device for Devices."""
    names = {"Sites": "Site", "Devices": "Device", "Alerts": "Alert"}
    return names.get(tag)


def page_for_tag(tag):
    title = f"{tag['name']} reference"
    out = [HEADER, f"# {title}", "", tag["description"], ""]
    if "UTC" in json.dumps(spec["paths"]) + json.dumps(spec["components"]):
        out += ["Times are in UTC (Coordinated Universal Time), in the format "
                "`2026-11-17T18:29:41Z`.", ""]
    obj = objects_for_tag(tag["name"])
    if obj:
        schema = spec["components"]["schemas"][obj]
        out += [f"## The {obj.lower()} object", "", schema["description"], "",
                fields_table(schema), ""]
    for path, item in spec["paths"].items():
        for method in METHODS:
            op = item.get(method)
            if op and tag["name"] in op.get("tags", []):
                out += operation_section(path, method, op)
    return "\n".join(out).rstrip() + "\n"


def main():
    check = "--check" in sys.argv
    stale = []
    OUT.mkdir(parents=True, exist_ok=True)
    for tag in spec["tags"]:
        page = OUT / f"{tag['name'].lower()}.md"
        text = page_for_tag(tag)
        if check:
            if not page.exists() or page.read_text() != text:
                stale.append(page.as_posix())
        else:
            page.write_text(text)
            print(f"Wrote {page}")
    # Publish a copy of the spec with the site, for download.
    spec_copy = Path("docs/openapi.yaml")
    if check:
        if not spec_copy.exists() or spec_copy.read_text() != SPEC.read_text():
            stale.append(spec_copy.as_posix())
    else:
        spec_copy.write_text(SPEC.read_text())
        print(f"Wrote {spec_copy}")
    if stale:
        print("These files don't match api/openapi.yaml:", ", ".join(stale))
        print("Run: python3 api/generate_reference.py")
        sys.exit(1)
    if check:
        print("The reference pages match api/openapi.yaml.")


if __name__ == "__main__":
    main()
