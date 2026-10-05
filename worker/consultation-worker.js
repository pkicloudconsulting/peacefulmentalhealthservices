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
const LOGO_URL = "https://www.peacefulmentalhealthservices.com/assets/img/logo-mark-v5.png";

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

// Palette ("Soothing and grounded")
const PERIWINKLE = "#5a6a9c";
const SAGE_GREEN = "#3f7a66";
const INK = "#24303a";
const SOFT = "#56616b";
const MIST = "#eef3f8";
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
    body: JSON.stringify(payload),
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
            <td style="vertical-align:middle;padding-right:12px;"><img src="${LOGO_URL}" width="56" height="56" alt="${PRACTICE} logo" style="display:block;border:0;border-radius:50%;"></td>
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
