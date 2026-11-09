# Projects

Most of these were built with AI coding agents (mainly Claude Code): I come up with the idea, make the calls and review, and the agent writes most of the code. Each repo's README says exactly how it was made.

## Water Tank Controller
**ESP32 · MQTT · Laravel · Livewire · Reverb · Docker · built with Claude Code** | [github.com/Schaulagain/water-tank-controller](https://github.com/Schaulagain/water-tank-controller)
* Fills the roof tank by itself, keeps the pump from running dry, and shows both tanks live on my phone.
* The controller next to the pump makes every decision, so the tanks keep filling even if WiFi or the server is down. A simulator stands in for the hardware until it's installed.
* Comes with a beginner-friendly hardware guide, so anyone with the same setup can build one.

## Laravel Nepal Payments
**Laravel 13 · PHP 8.4 · eSewa · Khalti · HBL · PHPUnit · GitHub Actions · built with Claude Code** | [github.com/Schaulagain/laravel-nepal-payments](https://github.com/Schaulagain/laravel-nepal-payments)
* A demo store that takes eSewa, Khalti and HBL card payments, written from scratch. It's based on the payment service I looked after at work.
* Checks eSewa's HMAC-SHA256 signatures and asks Khalti's lookup API before marking anything paid.
* Locks the payment row while applying a result, so a payment is only completed and invoiced once. A scheduled job re-checks payments where the customer never came back from the gateway.
* 20 tests with the gateway calls faked, run on GitHub Actions with PHP 8.4 and 8.5.

## Homelab
**Ubuntu Server 24.04 · Docker · Portainer · Pi-hole · Jellyfin · Tailscale · built with AI agents** | [github.com/Schaulagain/my-homelab](https://github.com/Schaulagain/my-homelab)
* An old laptop running Ubuntu Server with Pi-hole (ad blocking for the whole network), Jellyfin and Portainer in Docker.
* I reach it from outside over Tailscale, so no router ports are open.
* The repo has the Compose file and my setup notes.

## This Portfolio
**Node.js · JavaScript · GitHub Actions · Cloudflare · rebuilt with AI agents** | [source](https://github.com/Schaulagain/portfolio)
* This site. A small Node script with no dependencies turns Markdown files into static HTML, so the content still works without JavaScript and search engines can read it.
* GitHub Actions deploys it to GitHub Pages, with Cloudflare in front.

## Cloud Self-Service Portal (Accessworld Tech)
**PHP · Laravel · vSphere API · cPanel/WHM API · eSewa · HBL** | https://portal.awt.cloud
* Customers buy and manage VPS, domains, hosting and email here. I looked after the payment service that every purchase went through.
* I also worked on creating VMs and showing their stats through the vSphere API, and on automating the cPanel, email and domain products.

## Festival Management Database
**Oracle PL/SQL** | [github.com/Schaulagain/SQLProject](https://github.com/Schaulagain/SQLProject)
* A 2020 university project that I wrote, tidied up by AI agents in 2026. An Oracle schema using object types, VARRAYs, nested tables and REFs, with PL/SQL procedures, cursors, a package and triggers.

## Smaller Projects
* [Emotion-Detector](https://github.com/Schaulagain/Emotion-Detector): a webcam emotion classifier (Keras CNN, OpenCV) I built in 2021 to learn machine learning.
* [laravel-websocket](https://github.com/Schaulagain/laravel-websocket): a chat app using Laravel and WebSockets.
* [Todo-App](https://github.com/Schaulagain/Todo-App): a Laravel API with a Next.js front end.
