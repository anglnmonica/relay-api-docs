# Telecom pack

Style rules for networking and telecom documentation. Turn it on in
`docs-kit.yml`:

```yaml
packs:
  telecom: true
```

## Rules

| Rule | What it checks | Level |
| --- | --- | --- |
| `AcronymFirst` | Each acronym gets a definition the first time it appears, acronym first: CBRS (Citizens Broadband Radio Service). Common acronyms such as LTE and API are exempt. | Warning |
| `ExpansionFirst` | Flags the reverse order, Citizens Broadband Radio Service (CBRS), so pages stay consistent. | Warning |
| `Terms` | Standard spelling of common terms, such as Wi-Fi, 5G NR, O-RAN, eNodeB, and IoT. | Error |
| `Units` | Standard unit symbols, such as MHz, GHz, and dBm. | Error |
| `UnitSpacing` | A space between a number and its unit: 3.5 GHz, not 3.5GHz. | Error |

The pack turns off the base style's acronym rules, because they expect the
opposite order.

## Tests

`tests/should-fail.md` has one mistake per line, and `tests/should-pass.md`
has none. The rule tests fail if a rule misses a mistake or flags correct
text. Run them with:

```bash
bash packs/telecom/tests/run-tests.sh
```

## Add a term

Open `Telecom/Terms.yml` and add a line under `swap`, wrong forms on the
left and the correct form on the right. Then add a test line to
`tests/should-fail.md` with the wrong form, and one to `tests/should-pass.md`
with the correct form.
