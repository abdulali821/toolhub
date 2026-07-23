# Security Policy

HeyTools is a free online tools platform. Most tool workloads run in the browser; optional account features use Supabase. We take reports that could affect user privacy, session integrity, or production deployments seriously.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |
| Pre-1.0 | No        |

Only the latest **1.0.x** release line receives security fixes. Please upgrade before reporting issues against older builds.

## Responsible disclosure

We ask that you:

1. **Report privately** first—do not open a public GitHub issue or discussion for vulnerabilities that could be exploited.
2. Give us a **reasonable window** to investigate and ship a fix before publishing details (typically 90 days, or sooner once a patch is released).
3. Avoid privacy-invasive testing (other users’ accounts/data), destructive actions, or large-scale automated scanning of production without permission.
4. Include enough detail for reproduction: affected URL/route, environment, steps, impact, and (if possible) a minimal proof of concept.

Good-faith research that follows this policy will not result in legal action from the maintainers.

## Reporting a vulnerability

**Preferred:** use GitHub’s private [Security Advisories](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) for this repository (“Report a vulnerability”).

**Alternative:** submit details via the in-app [Request a tool](https://heytools.app/request-tool) form and mark the message as a security concern (do not include exploit payloads that could harm others).

Please include:

- Description of the issue and potential impact
- Affected version / commit if known
- Reproduction steps or PoC
- Whether you plan a public write-up, and preferred credit name

You should receive an acknowledgement when the report is received. We will follow up with triage status and, when appropriate, a coordinated fix and advisory.

## Scope notes

In scope examples:

- XSS, open redirects, auth/session flaws around login/favorites/history
- Leakage of secrets via `PUBLIC_*` misuse or misconfiguration docs that encourage unsafe patterns
- SSRF or injection in server routes / form actions

Out of scope / lower priority (unless chained into a real exploit):

- Issues that require an already-compromised machine or malicious browser extension
- Missing security headers on local `http://` development/preview without HTTPS
- Dependency advisories with no demonstrated impact on this app (still welcome; please note reachability)

## Thank you

Responsible disclosure helps keep HeyTools users safe. We appreciate your effort.
