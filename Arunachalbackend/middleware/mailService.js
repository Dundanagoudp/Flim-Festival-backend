// src/services/smtpMailService.js
import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    // secure: true,
    auth: {
        user: "mankavit.clatcoaching11@gmail.com",
        pass: "ADOJ6z04yjbaL9TY",
    },
});
const fromMail = "mankavit.clatcoaching11@gmail.com";
 

export async function sendMail({ to, subject, html, text,  }) {
    
  const info = await transporter.sendMail({
    from: fromMail,
    to,
    // cc,
    // bcc,
    // replyTo,
    subject,
    text,
    html,
  });
  return info;
}

/** Build a nice HTML + text email for a new Registration */
export function buildNewRegistrationEmail(reg) {
  const createdAt = new Date(reg.createdAt || Date.now()).toLocaleString("en-IN");
  const safe = (v) => (v == null || v === "" ? "-" : String(v));

  const details = [
    ["Name", safe(reg.name)],
    ["Email", safe(reg.email)],
    ["Phone", safe(reg.phone)],
    ["Message", safe(reg.message)],
  ];

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
      <h2 style="margin:0 0 12px;">🎉 New Registration Submitted</h2>
      <p style="margin:0 0 16px;">A new registration was submitted on <strong>${createdAt}</strong>.</p>
      <table cellspacing="0" cellpadding="6" style="border-collapse:collapse; width:100%; max-width:640px;">
        ${details
          .map(
            ([k, v]) => `
            <tr>
              <td style="border:1px solid #eee; font-weight:600; width:160px;">${k}</td>
              <td style="border:1px solid #eee;">${v}</td>
            </tr>`
          )
          .join("")}
      </table>
      <p style="margin-top:16px; color:#555;">Registration ID: ${safe(reg._id)}</p>
    </div>
  `;

  const text =
    `New Registration Submitted\n` +
    `Date: ${createdAt}\n` +
    details.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\nRegistration ID: ${safe(reg._id)}\n`;

  return { html, text };
}

/** Convenience wrapper specifically for admin notification */
export async function notifyAdminsOfRegistration(reg) {
  const { html, text } = buildNewRegistrationEmail(reg);

  // Supports comma-separated emails in ADMIN_EMAILS
  const recipients = process.env.ADMIN_EMAILS;
  if (!recipients) {
    console.warn("ADMIN_EMAILS not set. Skipping admin notification email.");
    return;
  }

  const subject =
    `New Registration: ${reg?.name || reg?.email || reg?._id || "Unknown"}`;

  return sendMail({
    to: recipients,
    subject,
    html,
    text,
  });
}

export function buildNewSubmissionEmail(sub) {
  const createdAt = new Date(sub.createdAt || Date.now()).toLocaleString("en-IN");
  const safe = (v) => (v == null || v === "" ? "-" : String(v));

  const rows = [
    ["Full Name", safe(sub.fullName)],
    ["Email", safe(sub.email)],
    ["Phone", safe(sub.phone)],
    ["Video Type", safe(sub.videoType)],
    [
      "Video Link",
      sub.videoFile ? `<a href="${sub.videoFile}" target="_blank" rel="noopener">${sub.videoFile}</a>` : "-",
    ],
    ["Message", safe(sub.message)],
  ];

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
    <h2 style="margin:0 0 12px;">🎬 New Submission Received</h2>
    <p style="margin:0 0 16px;">A new submission was received on <strong>${createdAt}</strong>.</p>
    <table cellspacing="0" cellpadding="8" style="border-collapse:collapse; width:100%; max-width:720px;">
      ${rows
        .map(
          ([k, v]) => `
        <tr>
          <td style="border:1px solid #eee; font-weight:600; width:160px;">${k}</td>
          <td style="border:1px solid #eee;">${v}</td>
        </tr>`
        )
        .join("")}
    </table>
    <p style="margin-top:16px; color:#555;">Submission ID: ${safe(sub._id)}</p>
  </div>`;

  const text =
    `New Submission Received\n` +
    `Date: ${createdAt}\n` +
    rows
      .map(([k, v]) => {
        // strip HTML if any (video link)
        const plain = String(v).replace(/<[^>]+>/g, "");
        return `${k}: ${plain}`;
      })
      .join("\n") +
    `\nSubmission ID: ${safe(sub._id)}\n`;

  return { html, text };
}

export async function notifyAdminsOfSubmission(sub) {
  const recipients = process.env.ADMIN_EMAILS;
  if (!recipients) {
    console.warn("ADMIN_EMAILS not set. Skipping admin notification email.");
    return;
  }
  const { html, text } = buildNewSubmissionEmail(sub);
  const subject = `New ${sub?.videoType || "Video"} Submission: ${sub?.fullName || sub?._id || ""}`;
  // Make replies go to the submitter
  return sendMail({ to: recipients, subject, html, text, replyTo: sub?.email });
}

// add to src/services/smtpMailService.js
export function buildNewContactUsEmail(doc) {
  const createdAt = new Date(doc.createdAt || Date.now()).toLocaleString("en-IN");
  const safe = (v) => (v == null || v === "" ? "-" : String(v));

  const rows = [
    ["Name", safe(doc.name)],
    ["Email", safe(doc.email)],
    ["Phone", safe(doc.phone)],
    // ["Subject", safe(doc.subject)],
    ["Message", safe(doc.message)],
  ];

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
    <h2 style="margin:0 0 12px;">📩 New Contact Us Message</h2>
    <p style="margin:0 0 16px;">Received on <strong>${createdAt}</strong>.</p>
    <table cellspacing="0" cellpadding="8" style="border-collapse:collapse; width:100%; max-width:720px;">
      ${rows
        .map(
          ([k, v]) => `
        <tr>
          <td style="border:1px solid #eee; font-weight:600; width:160px;">${k}</td>
          <td style="border:1px solid #eee;">${v}</td>
        </tr>`
        )
        .join("")}
    </table>
    <p style="margin-top:16px; color:#555;">Ticket: ${safe(doc._id)}</p>
  </div>`;

  const text =
    `New Contact Us Message\n` +
    `Date: ${createdAt}\n` +
    rows.map(([k, v]) => `${k}: ${String(v).replace(/<[^>]+>/g, "")}`).join("\n") +
    `\nTicket: ${safe(doc._id)}\n`;

  return { html, text, subject: `New Contact: ${doc?.name || doc?.email || doc?._id}` };
}

export async function notifyAdminsOfContactUs(doc) {
  const recipients = process.env.ADMIN_EMAILS;
  if (!recipients) {
    console.warn("ADMIN_EMAILS not set. Skipping Contact Us notification.");
    return;
  }
  const { html, text, subject } = buildNewContactUsEmail(doc);
  // make replies go to the user who wrote in
  return sendMail({ to: recipients, subject, html, text, replyTo: doc?.email });
}
