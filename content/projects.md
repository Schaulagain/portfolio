# Projects

## Laravel Nepal Payments
**Laravel 13 · PHP 8.4 · eSewa · Khalti · PHPUnit · GitHub Actions** | [github.com/Schaulagain/laravel-nepal-payments](https://github.com/Schaulagain/laravel-nepal-payments)
* Demo store taking payments through eSewa and Khalti, rebuilt from scratch around what I did at work: one payment layer every purchase goes through.
* Verifies eSewa's HMAC-SHA256 callback signatures and confirms Khalti payments through its lookup API, so nothing from the browser is trusted on its own.
* Idempotent processing with row locks and a unique invoice index; a scheduled job reconciles payments that never returned from the gateway.
* 20 feature tests with faked gateway calls, run in CI on PHP 8.4 and 8.5.

## Homelab
**Ubuntu Server 24.04 · Docker · Portainer · Pi-hole · Jellyfin · Tailscale** | [github.com/Schaulagain/my-homelab](https://github.com/Schaulagain/my-homelab)
* Turned an old laptop into a headless Ubuntu server running Pi-hole (network-wide ad blocking), Jellyfin and Portainer in Docker.
* Reachable remotely over a Tailscale VPN, without opening any router ports.
* Setup steps and troubleshooting notes are documented in the repository.

## This Portfolio
**Node.js · JavaScript · GitHub Actions · Cloudflare** | [source](https://github.com/Schaulagain/portfolio)
* Terminal-style portfolio with a dependency-free Node.js build that renders Markdown into static HTML, so the content works for search engines and visitors without JavaScript.
* Deployed by GitHub Actions to GitHub Pages behind Cloudflare, with a strict Content-Security-Policy and self-hosted fonts.

## Cloud Self-Service Portal (Accessworld Tech)
**PHP · Laravel · vSphere API · cPanel/WHM API · eSewa · HBL** | https://portal.awt.cloud
* Customers buy and manage VPS, domains, hosting and email in one place; I owned the payment service every purchase went through.
* VM provisioning and live stats through the vSphere API, plus automated cPanel, email and domain products.

## Festival Management Database
**Oracle PL/SQL** | [github.com/Schaulagain/SQLProject](https://github.com/Schaulagain/SQLProject)
* Object-relational Oracle schema (object types, VARRAYs, nested tables, scoped REFs) with procedures, cursors, a package, and validation and audit triggers.

## Smaller Experiments
* [laravel-websocket](https://github.com/Schaulagain/laravel-websocket): real-time chat built with Laravel and WebSockets.
* [Todo-App](https://github.com/Schaulagain/Todo-App): Laravel API back end with a Next.js front end.
