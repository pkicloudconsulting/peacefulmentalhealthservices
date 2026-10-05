<p align="center"><img src="../assets/img/logo-mark-v5.png" alt="Peaceful Mental Health Services logo" width="120"></p>

# Consultation form setup: Cloudflare Worker + Resend

The Contact page form (the five-step care finder) sends every request to a small Cloudflare Worker. The Worker sends two emails through Resend, both **from office@peacefulmentalhealthservices.com**:

1. **To the office:** the full request (name, email, phone, what they are looking for, support needs, state, payment, insurance plan, message). Reply-To is the visitor, so pressing Reply answers them directly.
2. **To the visitor:** a branded confirmation with the logo, the office phone and hours, and the 988 crisis line. It never repeats what they told us about their health.

Built-in spam protection: a hidden spam-trap field, at most 3 requests per visitor every 10 minutes, a 2 minute duplicate guard per email address, and optional Cloudflare Turnstile.

Everything below is free: Resend's free plan covers 3,000 emails a month (100 a day), and the Worker sits well inside Cloudflare's free tier. Your DNS stays at Namecheap. Plan on about 30 minutes, most of it waiting for DNS.

```
Visitor fills in /contact/
        │  (JSON, from the browser)
        ▼
Cloudflare Worker  pmhs-consultation.<your-subdomain>.workers.dev
        ├── spam trap, rate limit, duplicate guard
        ├── Resend: request email ──► office@peacefulmentalhealthservices.com (Namecheap Private Email)
        └── Resend: confirmation  ──► the visitor (from office@)
```

---

> **Status (2026-10-05):** the Worker is deployed at `https://pmhs-consultation.tight-bush-2238.workers.dev` on the info@pkicloudconsulting.com Cloudflare account, with the `RATE_LIMIT` KV namespace bound, and the contact form points at it. Remaining: Part 1 (Resend) and the `RESEND_API_KEY` secret (Part 2 step 4).

## Part 1. Resend: let office@ send email (about 15 minutes plus DNS wait)

1. Go to **https://resend.com** and sign up (use an account the practice controls).
2. Open **Domains**, click **Add domain**, enter `peacefulmentalhealthservices.com`, region **North Virginia (us-east-1)**.
3. Resend lists three or four DNS records. Typically:

   | Type | Host (Namecheap "Host") | Value | Priority |
   |---|---|---|---|
   | TXT | `resend._domainkey` | the long `p=...` key Resend shows | |
   | MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |
   | TXT | `send` | `v=spf1 include:amazonses.com ~all` | |
   | TXT (optional, recommended) | `_dmarc` | `v=DMARC1; p=none;` | |

   Copy the values from **your** Resend screen; the DKIM key is unique.

4. In **Namecheap**: Domain List, **Manage** next to the domain, **Advanced DNS**.
   - Add the TXT records under **Host Records** with **Add New Record**.
   - The MX record lives under **Mail Settings**. If it is set to **Private Email**, Namecheap manages the MX rows for you and you cannot add another. Switch it to **Custom MX**, then add three rows: `@` to `mx1.privateemail.com` (priority 10), `@` to `mx2.privateemail.com` (priority 10), and `send` to `feedback-smtp.us-east-1.amazonses.com` (priority 10). Leave the existing `v=spf1 include:spf.privateemail.com ~all` TXT on `@` exactly as it is.
   - After saving, send a test email to office@ from your phone to confirm the inbox still receives mail.
5. Back in Resend, click **Verify DNS records**. It usually turns green within 5 to 30 minutes (occasionally a few hours).
6. Open **API Keys**, click **Create API key**, name it `pmhs-website`, permission **Sending access**, domain `peacefulmentalhealthservices.com`. Copy the key now; Resend only shows it once. Do not paste it into the website, email, or chat. It only goes into Cloudflare in Part 2.

---

## Part 2. Cloudflare Worker (about 10 minutes, all in the browser)

1. Sign in at **https://dash.cloudflare.com** (the account used for DIF Consult is fine, or create a free one).
2. Open **Workers & Pages**, click **Create**, choose **Create Worker** (the "Hello World" starter), name it `pmhs-consultation`, click **Deploy**.
3. Click **Edit code**. Delete everything in the editor, paste the full contents of `worker/consultation-worker.js` from this repo, then click **Deploy**.
4. Go back to the Worker, open **Settings**, then **Variables and Secrets**, click **Add**:
   - Type **Secret**, Variable name `RESEND_API_KEY`, Value: the key from Part 1 step 6. Click **Deploy**.
5. Rate limit and duplicate guard (recommended):
   - Open **Storage & Databases**, **KV**, **Create a namespace**, name it `pmhs-rate-limit`.
   - Back on the Worker: **Settings**, **Bindings**, **Add**, **KV namespace**. Variable name `RATE_LIMIT`, namespace `pmhs-rate-limit`. Click **Deploy**.
6. Open the Worker's address in your browser (shown at the top of the Worker page, like `https://pmhs-consultation.<your-subdomain>.workers.dev`). You should see: *Peaceful Mental Health Services form receiver is running.*
7. Send that address to Claude. It goes into `FORM_ENDPOINT` in `contact/index.html`, then the site is pushed to `main`.

---

## Part 3. Test it end to end

1. On the live site, open **Contact**, go through the five steps, and use an email address you can check.
2. Within a minute:
   - office@ (Namecheap Private Email webmail) gets **New consultation request: <name> (<service>)** from office@, and pressing Reply addresses the visitor;
   - your test inbox gets **We received your request: Peaceful Mental Health Services**, with the logo.
3. If nothing arrives, check Resend **Emails** (every send and any error is listed there) and the Worker's **Logs** tab in Cloudflare. Also check the spam folder the first time.

---

## Optional: Cloudflare Turnstile (invisible bot check)

Add this only if spam gets through the built-in protection.

1. In Cloudflare open **Turnstile**, **Add widget**, add the hostnames `www.peacefulmentalhealthservices.com` and `peacefulmentalhealthservices.com`, mode **Managed**.
2. Copy the **Secret key** into the Worker as another secret named `TURNSTILE_SECRET`.
3. Send Claude the **Site key** (that one is public) so the widget can be added to the contact form. Once the secret is set, the Worker rejects requests without a passing token, so set the secret and the site key together.

---

## Privacy note

Requests pass through Cloudflare and Resend and land in the Namecheap inbox. None of these sign a HIPAA Business Associate Agreement on the free plans. The form already asks visitors not to type sensitive medical details, and the visitor's confirmation never repeats what they told us. If the practice is treated as a HIPAA covered entity (practices that bill insurance usually are), it is worth a quick check with the owner, or a move to providers that sign a BAA.

There is no Google Sheet in this setup: the office inbox is the record of every request. If a spreadsheet log is wanted later, the Worker can also write each request to one.

## Changing things later

- Office address, sender name, phone, hours: the constants at the top of `consultation-worker.js` (`OFFICE`, `FROM`, `PHONE`, `HOURS`). Paste the updated file into the Cloudflare editor and click **Deploy**.
- Allowed websites: `ALLOWED_ORIGINS` in the same file (the custom domain, the github.io address and the local preview are already there).
