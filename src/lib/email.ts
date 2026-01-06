import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface ContactFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  leadType: string;
  message: string;
}

export interface CareerFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  position?: string;
  message: string;
  resume?: string;
}

export interface ReferralFormData {
  referrerName: string;
  referrerEmail: string;
  referrerPhone: string;
  referredName: string;
  referredEmail?: string;
  referredPhone?: string;
  message?: string;
}

export async function sendContactEmail(data: ContactFormData) {
  const leadTypeLabels: Record<string, string> = {
    "1": "Yes, I am a potential new customer",
    "11": "No, I'm a current existing customer",
    "13": "I'm neither",
  };

  const html = `
    <h2>New Contact Form Submission</h2>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.firstName} ${data.lastName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${data.phone}">${data.phone}</a></td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${data.email}">${data.email}</a></td>
      </tr>
      ${
        data.address
          ? `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Address</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.address}${data.city ? `, ${data.city}` : ""}${data.state ? `, ${data.state}` : ""} ${data.zipCode || ""}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Customer Type</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${leadTypeLabels[data.leadType] || data.leadType}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Message</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.message.replace(/\n/g, "<br>")}</td>
      </tr>
    </table>
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      This message was sent from the BNC Builders website contact form.
    </p>
  `;

  const text = `
New Contact Form Submission

Name: ${data.firstName} ${data.lastName}
Phone: ${data.phone}
Email: ${data.email}
${data.address ? `Address: ${data.address}${data.city ? `, ${data.city}` : ""}${data.state ? `, ${data.state}` : ""} ${data.zipCode || ""}` : ""}
Customer Type: ${leadTypeLabels[data.leadType] || data.leadType}

Message:
${data.message}

---
This message was sent from the BNC Builders website contact form.
  `.trim();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@bncbuildersinc.com",
    to: process.env.EMAIL_TO || "info@bncbuildersinc.com",
    replyTo: data.email,
    subject: `New Contact Form: ${data.firstName} ${data.lastName}`,
    text,
    html,
  });
}

export async function sendCareerEmail(data: CareerFormData) {
  const html = `
    <h2>New Job Application</h2>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.firstName} ${data.lastName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${data.phone}">${data.phone}</a></td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${data.email}">${data.email}</a></td>
      </tr>
      ${
        data.position
          ? `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Position</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.position}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Message</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.message.replace(/\n/g, "<br>")}</td>
      </tr>
    </table>
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      This message was sent from the BNC Builders careers page.
    </p>
  `;

  const text = `
New Job Application

Name: ${data.firstName} ${data.lastName}
Phone: ${data.phone}
Email: ${data.email}
${data.position ? `Position: ${data.position}` : ""}

Message:
${data.message}

---
This message was sent from the BNC Builders careers page.
  `.trim();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@bncbuildersinc.com",
    to: process.env.EMAIL_CAREERS_TO || process.env.EMAIL_TO || "careers@bncbuildersinc.com",
    replyTo: data.email,
    subject: `New Job Application: ${data.firstName} ${data.lastName}`,
    text,
    html,
  });
}

export async function sendReferralEmail(data: ReferralFormData) {
  const html = `
    <h2>New Customer Referral</h2>
    <h3>Referrer Information</h3>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.referrerName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${data.referrerPhone}">${data.referrerPhone}</a></td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${data.referrerEmail}">${data.referrerEmail}</a></td>
      </tr>
    </table>

    <h3 style="margin-top: 20px;">Referred Person</h3>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.referredName}</td>
      </tr>
      ${
        data.referredPhone
          ? `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="tel:${data.referredPhone}">${data.referredPhone}</a></td>
      </tr>
      `
          : ""
      }
      ${
        data.referredEmail
          ? `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><a href="mailto:${data.referredEmail}">${data.referredEmail}</a></td>
      </tr>
      `
          : ""
      }
    </table>

    ${
      data.message
        ? `
    <h3 style="margin-top: 20px;">Additional Notes</h3>
    <p>${data.message.replace(/\n/g, "<br>")}</p>
    `
        : ""
    }

    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      This message was sent from the BNC Builders customer referral program page.
    </p>
  `;

  const text = `
New Customer Referral

Referrer Information:
Name: ${data.referrerName}
Phone: ${data.referrerPhone}
Email: ${data.referrerEmail}

Referred Person:
Name: ${data.referredName}
${data.referredPhone ? `Phone: ${data.referredPhone}` : ""}
${data.referredEmail ? `Email: ${data.referredEmail}` : ""}

${data.message ? `Additional Notes:\n${data.message}` : ""}

---
This message was sent from the BNC Builders customer referral program page.
  `.trim();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@bncbuildersinc.com",
    to: process.env.EMAIL_TO || "info@bncbuildersinc.com",
    replyTo: data.referrerEmail,
    subject: `New Customer Referral from ${data.referrerName}`,
    text,
    html,
  });
}
