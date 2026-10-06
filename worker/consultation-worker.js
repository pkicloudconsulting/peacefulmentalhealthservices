// Peaceful Mental Health Services: consultation form backend (Cloudflare Worker).
//
// Receives the care finder POST from /contact/ and, through Resend:
//   1. emails the request to office@peacefulmentalhealthservices.com (Reply-To = the visitor,
//      so the office answers straight from the inbox), and
//   2. sends the visitor a confirmation FROM office@ that never repeats what they told us
//      about their health.
//
// Secrets (set in the Cloudflare dashboard, never in this file):
//   RESEND_API_KEY    required
//   TURNSTILE_SECRET  optional; when set, every request must carry a passing Turnstile token
// Optional KV binding RATE_LIMIT: 3 requests per IP per 10 minutes, and a 2 minute duplicate guard per email.
// Setup walkthrough: worker/SETUP.md

const OFFICE = "office@peacefulmentalhealthservices.com";
const FROM = "Peaceful Mental Health Services <office@peacefulmentalhealthservices.com>";
const PRACTICE = "Peaceful Mental Health Services";
const PHONE = "+1 (804) 465-9225";
const PHONE_TEL = "+18044659225";
const HOURS = "Monday to Friday, 9:00 am to 5:00 pm";
const SITE = "https://www.peacefulmentalhealthservices.com/";
// The green logo travels inside each email (inline attachment, cid:pmhs-logo), so it shows even when the
// mail app blocks images from the web (Private Email webmail does by default). 112px PNG on white.
const LOGO_CID = "pmhs-logo";
const LOGO_PNG_BASE64 = "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";

const ALLOWED_ORIGINS = [
  "https://www.peacefulmentalhealthservices.com",
  "https://peacefulmentalhealthservices.com",
  "https://pkicloudconsulting.github.io",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
];

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const DUPLICATE_WINDOW_SECONDS = 120;

// Palette (Alma green look; names kept so the templates below need no changes)
const PERIWINKLE = "#0b4934";
const SAGE_GREEN = "#0b4934";
const INK = "#1f2b26";
const SOFT = "#4f5b55";
const MIST = "#e9f1ec";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Form fields the Worker reads (names match the care finder on /contact/).
const FIELDS = ["phone", "service", "support", "support_other", "location", "visit_type", "payment", "insurance_plan", "msg", "page"];

// Turns the raw form answers into the grouped sections of the office email. The care finder already
// folds "other" support into `support` and the plan into `payment` ("Insurance: Aetna"), so those are
// split back out here instead of being listed twice.
function requestSections(p, email) {
  const support = p.support || p.support_other || "";
  const other = p.support_other && !support.includes(p.support_other) ? p.support_other : "";
  const insured = /^insurance/i.test(p.payment);
  const plan = p.insurance_plan || (insured ? p.payment.replace(/^insurance:?\s*/i, "") : "");
  const submitted = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  }) + " ET";
  return [
    ["Contact", [
      ["Email", email, `mailto:${email}`],
      ["Phone", p.phone || "Not provided (reply by email)", p.phone ? `tel:${p.phone.replace(/[^\d+]/g, "")}` : ""],
    ]],
    ["What they are looking for", [
      ["Service", p.service || "Not selected"],
      ["Support with", support || "Not selected"],
      ...(other ? [["Also mentioned", other]] : []),
    ]],
    ["Location and visit", [
      ["Where they are", p.location || "Not given"],
      ["Visit type", p.visit_type || "Virtual (telehealth)"],
    ]],
    ["Coverage", [
      ["Payment", insured ? "Insurance" : (p.payment || "Not given")],
      ...(insured ? [["Insurance plan", plan || "Not given"]] : []),
    ]],
    ["Request details", [
      ["Submitted", submitted],
      ["Sent from", p.page ? `Website ${p.page}` : "Website contact form"],
    ]],
  ];
}

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function clean(v, max) {
  const s = Array.isArray(v) ? v.join(", ") : String(v == null ? "" : v);
  return s.trim().slice(0, max || 2000);
}

async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const out = await res.json().catch(() => ({ success: false }));
  return out.success === true;
}

async function sendViaResend(apiKey, payload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload.html && payload.html.includes(`cid:${LOGO_CID}`)
      ? { ...payload, attachments: [{ filename: "peaceful-mental-health-logo.png", content: LOGO_PNG_BASE64, content_id: LOGO_CID }] }
      : payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

// Email shell: white card on a pale blue ground, logo lockup, quiet footer.
function renderEmail(preheader, inner) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${MIST};">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${MIST};opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MIST};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e7ea;border-radius:18px;overflow:hidden;font-family:${FONT};">
        <tr><td style="padding:28px 36px 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:12px;"><img src="cid:${LOGO_CID}" width="56" height="56" alt="${PRACTICE} logo" style="display:block;border:0;border-radius:50%;"></td>
            <td style="vertical-align:middle;font-size:16px;font-weight:800;letter-spacing:0.4px;color:${INK};text-transform:uppercase;">Peaceful Mental Health<br><span style="font-size:11px;letter-spacing:4px;color:${PERIWINKLE};">Services</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 36px;"><div style="height:1px;background:#e2e7ea;font-size:0;line-height:0;">&nbsp;</div></td></tr>
        <tr><td style="padding:28px 36px 30px;">${inner}</td></tr>
        <tr><td style="padding:0 36px;"><div style="height:1px;background:#e2e7ea;font-size:0;line-height:0;">&nbsp;</div></td></tr>
        <tr><td style="padding:20px 36px 26px;font-size:12px;line-height:1.7;color:${SOFT};">
          ${esc(PRACTICE)} &middot; Online care for adults in Virginia and Washington State<br>
          <a href="${SITE}" style="color:${PERIWINKLE};text-decoration:none;">peacefulmentalhealthservices.com</a>
          &nbsp;&middot;&nbsp;<a href="tel:${PHONE_TEL}" style="color:${PERIWINKLE};text-decoration:none;">${esc(PHONE)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function eyebrow(t) {
  return `<div style="font-size:12px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:${SAGE_GREEN};margin:0 0 12px;">${esc(t)}</div>`;
}
function headline(html) {
  return `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;font-weight:800;color:${INK};">${html}</h1>`;
}
function para(html) {
  return `<p style="margin:0 0 15px;font-size:16px;line-height:1.65;color:${INK};">${html}</p>`;
}
function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px;"><tr>
    <td style="border-radius:999px;background:${SAGE_GREEN};">
      <a href="${href}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
    </td></tr></table>`;
}
function detailRow(label, valueHtml, last) {
  const b = last ? "" : "border-bottom:1px solid #eef1f4;";
  return `<tr>
    <td style="padding:10px 0;${b}font-size:13px;color:${SOFT};width:130px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:10px 0;${b}font-size:15px;color:${INK};font-weight:600;vertical-align:top;white-space:pre-wrap;">${valueHtml}</td>
  </tr>`;
}
// One titled block of label/value rows (a row may carry a link: mailto or tel).
function section(title, rows) {
  return `<div style="margin:22px 0 6px;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${PERIWINKLE};">${esc(title)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
    rows.map(([label, value, href], i) => detailRow(label,
      href ? `<a href="${esc(href)}" style="color:${PERIWINKLE};text-decoration:none;">${esc(value)}</a>` : esc(value),
      i === rows.length - 1)).join("") +
    `</table>`;
}
function chip(text) {
  return `<span style="display:inline-block;margin:0 6px 6px 0;padding:5px 12px;border-radius:999px;background:${MIST};color:${INK};font-size:13px;font-weight:600;">${esc(text)}</span>`;
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method === "GET") return new Response(`${PRACTICE} form receiver is running.`, { status: 200 });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);

    let data;
    try { data = JSON.parse(await request.text()); }
    catch { return json({ error: "Invalid request" }, 400, headers); }

    // Spam trap: the hidden "website" field is invisible to people, so anything in it is a bot.
    // Pretend success so the bot learns nothing.
    if (data.website) return json({ success: true }, 200, headers);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    if (env.RATE_LIMIT) {
      const key = `rl:${ip}`;
      const count = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
      if (count >= RATE_LIMIT_MAX) return json({ error: "Too many requests. Please try again in a few minutes or call us." }, 429, headers);
      await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
    }

    if (env.TURNSTILE_SECRET) {
      const passed = await verifyTurnstile(env.TURNSTILE_SECRET, data.turnstileToken, ip);
      if (!passed) return json({ error: "Verification failed. Please try again." }, 403, headers);
    }

    const p = {};
    FIELDS.forEach((k) => { p[k] = clean(data[k]); });
    const first = clean(data.fname, 80);
    const last = clean(data.lname, 80);
    const email = clean(data.email, 200);
    const name = `${first} ${last}`.trim();

    if (!first || !last || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "Please add your first and last name and a valid email." }, 400, headers);
    }

    // The same person pressing send twice within two minutes gets one request, not two.
    if (env.RATE_LIMIT) {
      const dupKey = `dup:${email.toLowerCase()}`;
      if (await env.RATE_LIMIT.get(dupKey)) return json({ success: true }, 200, headers);
      await env.RATE_LIMIT.put(dupKey, "1", { expirationTtl: DUPLICATE_WINDOW_SECONDS });
    }

    if (!env.RESEND_API_KEY) return json({ error: "Email is not configured yet." }, 500, headers);

    try {
      // 1) The request, to the office, grouped into sections. Reply-To is the visitor.
      const sections = requestSections(p, email);
      const glance = [p.service, (p.location || "").split(" (")[0], /^insurance/i.test(p.payment) ? "Insurance" : p.payment].filter(Boolean);
      await sendViaResend(env.RESEND_API_KEY, {
        from: FROM,
        to: [OFFICE],
        reply_to: email,
        subject: `New consultation request: ${name}${p.service ? ` (${p.service})` : ""}`,
        text: [
          `NEW CONSULTATION REQUEST: ${name}`,
          "",
          ...sections.flatMap(([title, rows]) => [title.toUpperCase(), ...rows.map(([label, value]) => `  ${label}: ${value}`), ""]),
          "THEIR MESSAGE",
          `  ${p.msg || "No message added."}`,
          "",
          `Press reply to answer ${first} directly.`,
        ].join("\n"),
        html: renderEmail(`${name}${glance.length ? `: ${glance.join(", ")}` : ""}`,
          eyebrow("New consultation request") +
          headline(esc(name)) +
          (glance.length ? `<div style="margin:-4px 0 4px;">${glance.map(chip).join("")}</div>` : "") +
          sections.map(([title, rows]) => section(title, rows)).join("") +
          `<div style="margin:22px 0 8px;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:${PERIWINKLE};">Their message</div>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="padding:14px 16px;background:${MIST};border-left:4px solid ${SAGE_GREEN};border-radius:0 10px 10px 0;font-size:15px;line-height:1.6;color:${p.msg ? INK : SOFT};white-space:pre-wrap;">${p.msg ? esc(p.msg) : "No message added."}</td>
          </tr></table>` +
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;"><tr>
            <td style="border-radius:999px;background:${SAGE_GREEN};"><a href="mailto:${esc(email)}?subject=${encodeURIComponent("Your consultation request")}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">Reply to ${esc(first)}</a></td>
            ${p.phone ? `<td style="width:10px;"></td><td style="border-radius:999px;border:1.5px solid ${SAGE_GREEN};"><a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}" style="display:inline-block;padding:11px 22px;font-size:14px;font-weight:700;color:${SAGE_GREEN};text-decoration:none;border-radius:999px;">Call ${esc(first)}</a></td>` : ""}
          </tr></table>` +
          `<p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${SOFT};">Or just press reply. This email is set to answer ${esc(first)} directly.</p>`
        ),
      });

      // 2) Confirmation to the visitor, FROM office@. It deliberately repeats nothing about their health.
      await sendViaResend(env.RESEND_API_KEY, {
        from: FROM,
        to: [email],
        reply_to: OFFICE,
        subject: `We received your request: ${PRACTICE}`,
        text: [
          `Hi ${first},`,
          "",
          `Thank you for reaching out to ${PRACTICE}. We have received your consultation request, and a member of our team will reply within one business day to help you schedule your first visit.`,
          "",
          `If you would rather talk, call us at ${PHONE}, ${HOURS}.`,
          "",
          "If you or someone you love is in crisis, please do not wait for our reply: call or text 988, the Suicide and Crisis Lifeline, available 24/7, or call 911.",
          "",
          "Warmly,",
          `The ${PRACTICE} team`,
          SITE,
          "",
          "This is an automatic confirmation. You can reply to this email if you need to add anything.",
        ].join("\n"),
        html: renderEmail("We received your request and will reply within one business day.",
          eyebrow("Request received") +
          headline(`Thank you, ${esc(first)}.`) +
          para(`We have received your consultation request. A member of our team will reply within <strong>one business day</strong> to help you schedule your first visit.`) +
          para(`If you would rather talk, call us at <a href="tel:${PHONE_TEL}" style="color:${PERIWINKLE};text-decoration:none;font-weight:600;">${esc(PHONE)}</a>, ${esc(HOURS)}.`) +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px;"><tr>
            <td style="padding:13px 16px;background:${MIST};border-left:4px solid ${PERIWINKLE};border-radius:0 10px 10px 0;font-size:14px;line-height:1.6;color:${INK};">
              If you or someone you love is in crisis, please do not wait for our reply. Call or text <strong>988</strong>, the Suicide and Crisis Lifeline, available 24/7, or call <strong>911</strong>.
            </td></tr></table>` +
          button(SITE, "Visit our website") +
          `<p style="margin:20px 0 0;font-size:16px;line-height:1.65;color:${INK};">Warmly,<br><strong>The ${esc(PRACTICE)} team</strong></p>` +
          `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${SOFT};">This is an automatic confirmation. You can reply to this email if you need to add anything.</p>`
        ),
      });

      return json({ success: true }, 200, headers);
    } catch (err) {
      // Shows in the Worker's Logs tab; carries Resend's status and reason only, never the visitor's details.
      console.error("send failed:", String((err && err.message) || err).slice(0, 300));
      return json({ error: `We could not send your request right now. Please call us at ${PHONE} or email ${OFFICE}.` }, 502, headers);
    }
  },
};
