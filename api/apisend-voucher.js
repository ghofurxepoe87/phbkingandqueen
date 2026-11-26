export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      toEmail,
      guestName,
      tableId,
      bookingRef,
      guestType,
      roomInfo,
      paxBreakdown,
      arrivalTime,
      amountLabel,
      amountFormatted,
      pdfBase64,
      pdfFilename
    } = req.body;

    if (!toEmail || !guestName || !pdfBase64) {
      return res.status(400).json({ error: 'Missing required email or PDF data.' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY is not configured in Vercel Environment Variables.' });
    }

    const roomRowHtml = roomInfo
      ? `<tr><td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Room Number & Type</td><td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">${roomInfo}</td></tr>`
      : '';

    const htmlBody = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#035388 0%,#023e66 100%);padding:22px 28px;color:#ffffff;border-bottom:4px solid #d97706;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#fde047;text-transform:uppercase;">Platinum Hotel & Convention Hall Balikpapan</div>
          <h1 style="margin:6px 0 4px;font-size:21px;font-weight:800;letter-spacing:0.5px;">CONFIRMATION LETTER</h1>
          <div style="font-size:13px;color:#e0f2fe;">King & Queen of the Night 2027 • New Year's Eve Gala</div>
        </div>

        <div style="padding:26px 28px;color:#1e293b;line-height:1.65;font-size:14px;">
          <p style="margin-top:0;">Dear <strong>${guestName}</strong>,</p>
          <p>Warmest greetings from <strong>Platinum Hotel & Convention Hall Balikpapan</strong>.</p>
          <p>Thank you for choosing to celebrate the New Year with us. We are pleased to attach your official <strong>Confirmation Letter (PDF Form)</strong> for <strong>King & Queen of the Night 2027</strong>. Below is a summary of your confirmed table registration:</p>

          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px 20px;margin:18px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Confirmation No.</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">${bookingRef}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Assigned Table</td>
                <td style="padding:8px 0;font-weight:800;text-align:right;color:#035388;font-size:16px;border-bottom:1px dashed #e2e8f0;">Table #${tableId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Guest Category</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">${guestType}</td>
              </tr>
              ${roomRowHtml}
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Party Size</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">${paxBreakdown}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Event Date & Time</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">31 December 2026 • ${arrivalTime}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;">${amountLabel}</td>
                <td style="padding:8px 0;font-weight:800;text-align:right;color:#059669;">${amountFormatted}</td>
              </tr>
            </table>
          </div>

          <p style="background:#fefce8;border-left:4px solid #d97706;padding:12px 14px;border-radius:6px;font-size:13px;color:#78350f;">
            <strong>Important Check-In Notice:</strong> Please present the attached <strong>Confirmation Letter (PDF)</strong> upon arrival at the Grand Golden Ballroom Entrance. Our Greeter Team will assist you directly to <strong>Table #${tableId}</strong>.
          </p>

          <p style="margin-bottom:0;">We look forward to welcoming you and creating a memorable New Year celebration.<br><br>
          Sincerely yours,<br>
          <strong>Food & Beverage Management</strong><br>
          Platinum Hotel & Convention Hall Balikpapan<br>
          <span style="font-size:12px;color:#64748b;">Jl. Soekarno Hatta Km. 5, Balikpapan 76125 • Tel: +62 542 883 0228</span></p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Platinum Hotel Balikpapan <${SENDER_EMAIL}>`,
        to: [toEmail],
        subject: `Confirmation Letter (Table #${tableId}) — King & Queen of the Night 2027`,
        html: htmlBody,
        attachments: [
          {
            filename: pdfFilename || `Confirmation_Letter_Table_${tableId}.pdf`,
            content: pdfBase64
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Email provider rejected request.' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
}
