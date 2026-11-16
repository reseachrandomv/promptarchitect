# Security Policy

PromptArchitect is a static, client-side web app. Privacy and security are its core promise, so we take reports seriously.

## Supported versions

Only the latest version on the `main` branch (deployed at https://reseachrandomv.github.io/promptarchitect/) is supported.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/reseachrandomv/promptarchitect/security) of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue, the steps to reproduce it, and its impact. Use fake data only; never include real secrets.

You can also go straight to [https://github.com/reseachrandomv/promptarchitect/security/advisories/new](https://github.com/reseachrandomv/promptarchitect/security/advisories/new).

We aim to acknowledge reports within 7 days, and to keep you updated until the issue is resolved. With your permission, we'll credit you in the advisory and the release notes.

## In scope

- Anything that could make prompt content leave the browser.
- XSS through prompt fields, template names, imported data or the syntax highlighter.
- Exports that are malformed in a way that could inject content into the tools that consume them.

## Out of scope

- Vulnerabilities in third-party CDNs or browsers themselves (please report those upstream).
- Issues that need a compromised device or a malicious browser extension.
