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
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'banquet@platinumhotelbalikpapan.com';

    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY is not configured in Vercel Environment Variables.' });
    }

    const roomRowHtml = roomInfo
      ? `<tr><td style="padding:8px 0;color:#64748b;">Room Number & Type</td><td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;">${roomInfo}</td></tr>`
      : '';

    const htmlBody = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#035388 0%,#023e66 100%);padding:24px 28px;color:#ffffff;border-bottom:4px solid #d97706;">
          <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#fde047;text-transform:uppercase;">Platinum Hotel & Convention Hall Balikpapan</div>
          <h1 style="margin:6px 0 4px;font-size:22px;font-weight:800;letter-spacing:0.3px;">KING & QUEEN OF THE NIGHT 2027</h1>
          <div style="font-size:13px;color:#e0f2fe;">Official Ballroom Table Reservation Confirmation</div>
        </div>

        <div style="padding:26px 28px;color:#1e293b;line-height:1.6;font-size:14px;">
          <p style="margin-top:0;">Dear <strong>${guestName}</strong>,</p>
          <p>Warmest greetings from <strong>Platinum Hotel & Convention Hall Balikpapan</strong>.</p>
          <p>We are delighted to confirm your table reservation for our exclusive New Year's Eve Gala celebration, <strong>King & Queen of the Night 2027</strong>. Please find your official reservation details below and your printable e-voucher attached as a PDF document:</p>

          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:16px 20px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Booking Reference</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">${bookingRef}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Assigned Table</td>
                <td style="padding:8px 0;font-weight:800;text-align:right;color:#035388;font-size:16px;border-bottom:1px dashed #e2e8f0;">Table #${tableId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Reservation Category</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">${guestType}</td>
              </tr>
              ${roomRowHtml}
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Party Size</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">${paxBreakdown}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Event Date & Arrival</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">31 December 2026 • ${arrivalTime}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;border-bottom:1px dashed #e2e8f0;">Venue</td>
                <td style="padding:8px 0;font-weight:700;text-align:right;color:#0f172a;border-bottom:1px dashed #e2e8f0;">Grand Golden Ballroom</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;">${amountLabel}</td>
                <td style="padding:8px 0;font-weight:800;text-align:right;color:#059669;">${amountFormatted}</td>
              </tr>
            </table>
          </div>

          <p style="background:#fefce8;border-left:4px solid #d97706;padding:12px 14px;border-radius:6px;font-size:13px;color:#78350f;">
            <strong>Arrival & Greeter Check-In:</strong> Kindly present the attached PDF confirmation voucher at the Grand Golden Ballroom entrance upon arrival. Our Greeter Team will be pleased to escort you directly to <strong>Table #${tableId}</strong>.
          </p>

          <p>Should you require any further assistance or special arrangements prior to the event, please do not hesitate to contact our Banquet & Hospitality Team.</p>
          <p style="margin-bottom:0;">We look forward to welcoming you for an unforgettable evening.<br><br>
          Warm regards,<br>
          <strong>Food & Beverage / Banquet Management</strong><br>
          Platinum Hotel & Convention Hall Balikpapan</p>
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
        subject: `Table Reservation Confirmation (#${tableId}) — King & Queen of the Night 2027`,
        html: htmlBody,
        attachments: [
          {
            filename: pdfFilename || `Reservation_Table_${tableId}.pdf`,
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
