# Shortly — Specification

## Problem

People share long URLs in chats and slides. They want short links and to know how many times each
link was opened.

## Users and roles

- **Visitor:** opens a short link and is redirected.
- **User:** signs in with email magic link; creates, lists and deletes their own short links and sees
  click counts.

## Must have

- Create a short link from a valid http(s) URL; optional custom alias (3–30 chars, letters, digits,
  dashes), unique.
- Redirect `/<code>` to the target with HTTP 302 in under 200 ms p95 on staging.
- Count clicks per link (total and per day for the last 30 days).
- A user only sees and deletes their own links.
- Rate limit: max 30 link creations per user per hour.

## Should have

- QR code for each link.

## Out of scope

- Teams, custom domains, paid plans.

## Constraints

- Free tiers only. TypeScript.

## Data

Users (email), links (code, target, owner, created_at), clicks (link, timestamp, no IP stored).

## Deployment

Vercel, with a serverless Postgres from the Vercel Marketplace (free tier).

## Clarifications
