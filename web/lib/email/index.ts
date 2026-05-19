import { Resend } from "resend";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  const resend = getResendClient();

  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || "TicketNFT <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("Email send exception:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export function generateTicketPurchaseEmail({
  eventTitle,
  tierName,
  tokenId,
  eventDate,
  venue,
  txHash,
}: {
  eventTitle: string;
  tierName: string;
  tokenId: number;
  eventDate: string;
  venue: string;
  txHash: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #e60023 0%, #ff6b6b 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .ticket-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #e60023; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { color: #6b7280; font-size: 14px; }
        .value { font-weight: 600; }
        .button { display: inline-block; background: #e60023; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .tx-hash { font-family: monospace; font-size: 12px; color: #6b7280; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin:0;font-size:24px;">🎫 Ticket Purchase Confirmed!</h1>
        <p style="margin:10px 0 0;opacity:0.9;">Your NFT ticket has been minted successfully</p>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Your ticket for <strong>${eventTitle}</strong> has been successfully purchased and minted as an NFT on the Sepolia blockchain.</p>

        <div class="ticket-card">
          <h3 style="margin-top:0;color:#e60023;">Ticket Details</h3>
          <div class="detail-row">
            <span class="label">Event</span>
            <span class="value">${eventTitle}</span>
          </div>
          <div class="detail-row">
            <span class="label">Tier</span>
            <span class="value">${tierName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Token ID</span>
            <span class="value">#${tokenId}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date</span>
            <span class="value">${eventDate}</span>
          </div>
          <div class="detail-row">
            <span class="label">Venue</span>
            <span class="value">${venue}</span>
          </div>
        </div>

        <p><strong>Transaction Hash:</strong></p>
        <p class="tx-hash">${txHash}</p>

        <p>You can view your ticket and QR code in the <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/my-tickets" style="color:#e60023;">My Tickets</a> page.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/my-tickets" class="button">View My Tickets</a>
      </div>
      <div class="footer">
        <p>This email was sent by TicketNFT - NFT Event Ticketing Platform</p>
        <p>© ${new Date().getFullYear()} TicketNFT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateEventReminderEmail({
  eventTitle,
  eventDate,
  venue,
  tierName,
  tokenId,
}: {
  eventTitle: string;
  eventDate: string;
  venue: string;
  tierName: string;
  tokenId: number;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .event-card { background: #fffbeb; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .button { display: inline-block; background: #e60023; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin:0;font-size:24px;">⏰ Event Reminder</h1>
        <p style="margin:10px 0 0;opacity:0.9;">Your event is coming up soon!</p>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>This is a friendly reminder that <strong>${eventTitle}</strong> is happening soon!</p>

        <div class="event-card">
          <h3 style="margin-top:0;color:#f59e0b;">Event Details</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Venue:</strong> ${venue}</p>
          <p><strong>Your Ticket:</strong> ${tierName} (Token #${tokenId})</p>
        </div>

        <p>Don't forget to bring your QR code for check-in. You can view it in the <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/my-tickets" style="color:#e60023;">My Tickets</a> page.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/my-tickets" class="button">View My Ticket & QR Code</a>
      </div>
      <div class="footer">
        <p>This email was sent by TicketNFT - NFT Event Ticketing Platform</p>
        <p>© ${new Date().getFullYear()} TicketNFT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateListingEmail({
  eventTitle,
  tierName,
  tokenId,
  price,
}: {
  eventTitle: string;
  tierName: string;
  tokenId: number;
  price: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .listing-card { background: #f5f3ff; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
        .button { display: inline-block; background: #e60023; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin:0;font-size:24px;">📢 Ticket Listed for Sale</h1>
        <p style="margin:10px 0 0;opacity:0.9;">Your ticket is now on the marketplace</p>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Your ticket has been successfully listed on the TicketNFT marketplace!</p>

        <div class="listing-card">
          <h3 style="margin-top:0;color:#8b5cf6;">Listing Details</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Tier:</strong> ${tierName}</p>
          <p><strong>Token ID:</strong> #${tokenId}</p>
          <p><strong>Listing Price:</strong> ${price} ETH</p>
        </div>

        <p>You'll receive a notification when someone purchases your ticket. You can manage your listings in the <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/my-tickets" style="color:#e60023;">My Tickets</a> page.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/marketplace" class="button">View Marketplace</a>
      </div>
      <div class="footer">
        <p>This email was sent by TicketNFT - NFT Event Ticketing Platform</p>
        <p>© ${new Date().getFullYear()} TicketNFT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateSaleEmail({
  eventTitle,
  tierName,
  tokenId,
  price,
  buyerAddress,
}: {
  eventTitle: string;
  tierName: string;
  tokenId: number;
  price: string;
  buyerAddress: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .sale-card { background: #ecfdf5; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; }
        .button { display: inline-block; background: #e60023; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin:0;font-size:24px;">🎉 Ticket Sold!</h1>
        <p style="margin:10px 0 0;opacity:0.9;">Your ticket has been purchased</p>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Great news! Your listed ticket has been sold on the marketplace.</p>

        <div class="sale-card">
          <h3 style="margin-top:0;color:#10b981;">Sale Details</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Tier:</strong> ${tierName}</p>
          <p><strong>Token ID:</strong> #${tokenId}</p>
          <p><strong>Sale Price:</strong> ${price} ETH</p>
          <p><strong>Buyer:</strong> ${buyerAddress.slice(0, 6)}...${buyerAddress.slice(-4)}</p>
        </div>

        <p>The funds have been transferred to your wallet (minus platform fee and royalty). Check your wallet for the payment.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile" class="button">View Profile</a>
      </div>
      <div class="footer">
        <p>This email was sent by TicketNFT - NFT Event Ticketing Platform</p>
        <p>© ${new Date().getFullYear()} TicketNFT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}
