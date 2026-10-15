# Projects

## Laravel Nepal Payments
**Laravel 13 · PHP 8.4 · eSewa · Khalti · PHPUnit · GitHub Actions** | [github.com/Schaulagain/laravel-nepal-payments](https://github.com/Schaulagain/laravel-nepal-payments)
* A demo store that takes eSewa and Khalti payments, written from scratch. It's based on the payment service I looked after at work.
* Checks eSewa's HMAC-SHA256 signatures and asks Khalti's lookup API before marking anything paid. The browser redirect alone is never trusted.
* Locks the payment row while applying a result, so a payment is only completed and invoiced once. A scheduled job re-checks payments where the customer never came back from the gateway.
* 20 tests with the gateway calls faked, run on GitHub Actions with PHP 8.4 and 8.5.

## Homelab
**Ubuntu Server 24.04 · Docker · Portainer · Pi-hole · Jellyfin · Tailscale** | [github.com/Schaulagain/my-homelab](https://github.com/Schaulagain/my-homelab)
* An old laptop running Ubuntu Server with Pi-hole (ad blocking for the whole network), Jellyfin and Portainer in Docker.
* I reach it from outside over Tailscale, so no router ports are open.
* The repo has the Compose file and my setup notes.

## This Portfolio
**Node.js · JavaScript · GitHub Actions · Cloudflare** | [source](https://github.com/Schaulagain/portfolio)
* This site. A small Node script with no dependencies turns Markdown files into static HTML, so the content still works without JavaScript and search engines can read it.
* GitHub Actions deploys it to GitHub Pages, with Cloudflare in front.

## Cloud Self-Service Portal (Accessworld Tech)
**PHP · Laravel · vSphere API · cPanel/WHM API · eSewa · HBL** | https://portal.awt.cloud
* Customers buy and manage VPS, domains, hosting and email here. I looked after the payment service that every purchase went through.
* I also worked on creating VMs and showing their stats through the vSphere API, and on automating the cPanel, email and domain products.

## Festival Management Database
**Oracle PL/SQL** | [github.com/Schaulagain/SQLProject](https://github.com/Schaulagain/SQLProject)
* A university project. An Oracle schema using object types, VARRAYs, nested tables and REFs, with PL/SQL procedures, cursors, a package and triggers.

## Smaller Projects
* [laravel-websocket](https://github.com/Schaulagain/laravel-websocket): a chat app using Laravel and WebSockets.
* [Todo-App](https://github.com/Schaulagain/Todo-App): a Laravel API with a Next.js front end.
