export type CertificateData = {
  fullName: string
  program: string
  completionDate: Date
  certificateId: string
  finalScore?: number | null
  /** Free programmes render a diagonal "Energy & Logics" watermark. */
  freeCourse?: boolean
  /** Awaiting admin stamp — preview only, not publicly verifiable. */
  pendingApproval?: boolean
  /** Origin used to resolve image assets (print window has no base URL). */
  assetBaseUrl?: string
  verifyUrl?: string
  qrImageUrl?: string
}

export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CERT-${timestamp}-${random}`
}

export function createCertificateHTML({
  fullName,
  program,
  completionDate,
  certificateId,
  finalScore,
  freeCourse = false,
  pendingApproval = false,
  assetBaseUrl = '',
  verifyUrl,
  qrImageUrl,
}: CertificateData): string {
  const isOfficial = !pendingApproval
  const formattedDate = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const logoUrl = `${assetBaseUrl}/images/energy-logics-logo-full.png`
  const stampUrl = `${assetBaseUrl}/images/company-stamp.png`

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate — ${fullName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Great+Vibes&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Libre Baskerville', Georgia, serif;
          background: #e8ebf0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .certificate {
          width: 297mm;
          height: 210mm;
          position: relative;
          background: #ffffff;
          margin: 0 auto;
          overflow: hidden;
        }

        .frame {
          position: absolute;
          inset: 8mm;
          border: 3px solid #1e3a5f;
        }
        .frame::before {
          content: '';
          position: absolute;
          inset: 3mm;
          border: 1px solid #b8941f;
        }

        .corner {
          position: absolute;
          width: 22mm;
          height: 22mm;
          border-color: #b8941f;
          border-style: solid;
          border-width: 0;
        }
        .corner.tl { top: 13mm; left: 13mm; border-top-width: 3px; border-left-width: 3px; }
        .corner.tr { top: 13mm; right: 13mm; border-top-width: 3px; border-right-width: 3px; }
        .corner.bl { bottom: 13mm; left: 13mm; border-bottom-width: 3px; border-left-width: 3px; }
        .corner.br { bottom: 13mm; right: 13mm; border-bottom-width: 3px; border-right-width: 3px; }

        .watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.06;
          pointer-events: none;
        }
        .watermark img { width: 140mm; }

        /* Free programme — stronger, readable watermark */
        .text-watermark {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          overflow: hidden;
        }
        .text-watermark .wm-primary {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-28deg);
          font-family: 'Cinzel', 'Times New Roman', serif;
          font-size: 58px;
          font-weight: 700;
          letter-spacing: 10px;
          color: #1e3a5f;
          opacity: 0.24;
          white-space: nowrap;
          text-transform: uppercase;
          text-shadow: 0 0 1px rgba(30, 58, 95, 0.15);
        }
        .text-watermark .wm-secondary {
          position: absolute;
          top: 62%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-28deg);
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 6px;
          color: #1e3a5f;
          opacity: 0.20;
          white-space: nowrap;
          text-transform: uppercase;
        }
        .text-watermark .wm-repeat {
          position: absolute;
          inset: -20%;
          background-image: repeating-linear-gradient(
            -28deg,
            transparent,
            transparent 38mm,
            rgba(30, 58, 95, 0.04) 38mm,
            rgba(30, 58, 95, 0.04) 39mm
          );
        }

        .content {
          position: absolute;
          inset: 14mm 22mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 3;
        }

        .logo { height: 34mm; margin-top: 0; }

        .cert-title {
          font-family: 'Cinzel', 'Times New Roman', serif;
          font-size: 34px;
          font-weight: 700;
          color: #1e3a5f;
          letter-spacing: 6px;
          margin: 6mm 0 0;
          text-transform: uppercase;
        }

        .cert-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          color: #b8941f;
          letter-spacing: 5px;
          text-transform: uppercase;
          font-weight: 600;
          margin-top: 2mm;
        }

        .presented {
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          color: #4a5568;
          margin-top: 7mm;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .recipient {
          font-family: 'Great Vibes', cursive;
          font-size: 54px;
          color: #1e3a5f;
          margin-top: 2mm;
          line-height: 1.05;
        }

        .rule {
          width: 115mm;
          border-bottom: 2px solid #b8941f;
          margin-top: 1.5mm;
        }

        .achievement {
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 13px;
          color: #2d3748;
          margin-top: 5mm;
          line-height: 1.75;
          max-width: 170mm;
          padding-bottom: 2mm;
        }

        .program-name {
          font-family: 'Cinzel', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: #1e3a5f;
          margin-top: 2mm;
          letter-spacing: 1px;
        }

        .score-line {
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          color: #4a5568;
          margin-top: 2mm;
          letter-spacing: 0.5px;
        }
        .score-line strong { color: #1e3a5f; font-weight: 700; }

        .free-upgrade-notice {
          margin: 4mm auto 0;
          max-width: 165mm;
          padding: 3mm 4mm;
          border: 1.5px solid #b8941f;
          border-radius: 2mm;
          background: rgba(184, 148, 31, 0.08);
          font-family: 'Montserrat', sans-serif;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.55;
          color: #1e3a5f;
          letter-spacing: 0.2px;
        }
        .free-upgrade-notice strong {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #9a7b1a;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 1mm;
        }

        .bottom-row {
          margin-top: auto;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8mm;
          padding-bottom: 16mm;
        }

        .right-column {
          width: 72mm;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5mm;
        }

        .sig-block {
          text-align: center;
          width: 100mm;
          flex: 1;
          max-width: 48%;
          position: relative;
          min-height: 42mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-top: 8mm;
        }

        /* Stamp centered over the whole signature block */
        .sig-stamp {
          position: absolute;
          width: 62mm;
          height: auto;
          opacity: 0.90;
          transform: translate(-50%, -50%) rotate(-10deg);
          left: 50%;
          top: 50%;
          z-index: 1;
          pointer-events: none;
          mix-blend-mode: multiply;
          filter: contrast(1.15) saturate(1.1);
        }

        .sig-name {
          position: relative;
          z-index: 2;
          font-family: 'Cinzel', 'Times New Roman', serif;
          font-size: 22px;
          font-weight: 700;
          color: #1e3a5f;
          letter-spacing: 3px;
          line-height: 1.2;
          text-transform: uppercase;
          text-shadow: 0 0 10px rgba(255,255,255,0.9);
        }

        .sig-rule {
          position: relative;
          z-index: 2;
          width: 72mm;
          border-top: 1.5px solid #2d3748;
          margin: 2mm 0 1.5mm;
        }

        .sig-org {
          position: relative;
          z-index: 2;
          font-family: 'Montserrat', sans-serif;
          font-size: 9px;
          line-height: 1.45;
          color: #5a6472;
          letter-spacing: 0.3px;
          margin-top: 0.5mm;
          max-width: 90mm;
        }

        .sig-pending {
          position: relative;
          z-index: 2;
          font-family: 'Montserrat', sans-serif;
          font-size: 9px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-top: 2mm;
          padding: 2mm 3mm;
          border: 1px dashed #cbd5e1;
          border-radius: 1mm;
        }

        .pending-approval-notice {
          margin: 4mm auto 0;
          max-width: 165mm;
          padding: 3mm 4mm;
          border: 1.5px solid #64748b;
          border-radius: 2mm;
          background: rgba(100, 116, 139, 0.1);
          font-family: 'Montserrat', sans-serif;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.55;
          color: #334155;
        }
        .pending-approval-notice strong {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 1mm;
        }

        .date-block {
          text-align: center;
          width: 100%;
        }

        .qr-block {
          text-align: center;
          background: #fff;
          padding: 2mm 2.5mm;
          border: 1px solid #d1d9e6;
          border-radius: 2mm;
        }
        .qr-block img {
          width: 20mm;
          height: 20mm;
          display: block;
          margin: 0 auto;
        }
        .qr-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 6.5px;
          font-weight: 600;
          color: #1e3a5f;
          margin-top: 1mm;
          letter-spacing: 0.2px;
          text-transform: uppercase;
        }
        .qr-hint {
          font-family: 'Montserrat', sans-serif;
          font-size: 5.5px;
          color: #718096;
          margin-top: 0.5mm;
        }

        .date-value {
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 14px;
          font-weight: 700;
          color: #1e3a5f;
          margin-bottom: 1.5mm;
        }
        .date-rule {
          border-top: 1.5px solid #2d3748;
          margin: 0 12mm 1.5mm;
        }
        .date-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #1e3a5f;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .footer {
          position: absolute;
          bottom: 11mm;
          left: 22mm;
          right: 22mm;
          text-align: center;
          font-family: 'Montserrat', sans-serif;
          font-size: 8px;
          line-height: 1.5;
          color: #718096;
          letter-spacing: 0.3px;
          z-index: 3;
          padding-top: 2mm;
          border-top: 1px solid #e2e8f0;
        }
        .footer .cert-id {
          display: block;
          font-weight: 700;
          color: #1e3a5f;
          font-size: 11px;
          letter-spacing: 0.5px;
          margin-bottom: 0.5mm;
        }
        .footer .cert-id code {
          font-family: 'Montserrat', monospace;
          font-size: 11.5px;
          font-weight: 700;
          color: #0f2744;
          background: #f1f5f9;
          padding: 0.5mm 1.5mm;
          border-radius: 1mm;
        }
        .footer .verify-line {
          display: block;
          font-size: 7px;
          color: #94a3b8;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="frame"></div>
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>

        <div class="watermark"><img src="${logoUrl}" alt=""></div>
        ${
          freeCourse
            ? `<div class="text-watermark">
                <div class="wm-repeat"></div>
                <div class="wm-primary">Energy &amp; Logics</div>
                <div class="wm-secondary">Complimentary Programme Certificate</div>
              </div>`
            : ''
        }
        ${
          pendingApproval
            ? `<div class="text-watermark">
                <div class="wm-repeat"></div>
                <div class="wm-primary">Pending Approval</div>
                <div class="wm-secondary">Awaiting Official Stamp &amp; Signature</div>
              </div>`
            : ''
        }

        <div class="content">
          <img class="logo" src="${logoUrl}" alt="Energy & Logics">

          <div class="cert-title">Certificate of Completion</div>
          <div class="cert-subtitle">Professional Training &amp; Development</div>

          <div class="presented">This certificate is proudly presented to</div>
          <div class="recipient">${fullName}</div>
          <div class="rule"></div>

          <div class="achievement">
            for successfully completing all required coursework and assessments of the programme
            <div class="program-name">${program}</div>
            ${
              finalScore != null
                ? `<div class="score-line">achieving a final average score of <strong>${finalScore}%</strong></div>`
                : ''
            }
            ${
              freeCourse
                ? `<div class="free-upgrade-notice">
                    <strong>Complimentary certificate — watermark applied</strong>
                    Upgrade to the paid version of this programme to receive an official certificate without watermark.
                  </div>`
                : ''
            }
            ${
              pendingApproval
                ? `<div class="pending-approval-notice">
                    <strong>Preview — pending admin approval</strong>
                    This certificate will receive the official company stamp and authorised signature once approved by Energy and Logics Ltd. It is not yet publicly verifiable.
                  </div>`
                : ''
            }
          </div>

          <div class="bottom-row">
            <div class="sig-block">
              ${isOfficial ? `<img class="sig-stamp" src="${stampUrl}" alt="Official company stamp">` : ''}
              ${
                isOfficial
                  ? `<div class="sig-name">Elie BISAMAZA</div>
                     <div class="sig-rule"></div>
                     <div class="sig-org">Managing Director · Energy and Logics Ltd</div>`
                  : `<div class="sig-rule" style="margin-top: 18mm"></div>
                     <div class="sig-pending">Awaiting official stamp &amp; signature</div>`
              }
            </div>

            <div class="right-column">
              ${
                qrImageUrl && isOfficial
                  ? `<div class="qr-block">
                      <img src="${qrImageUrl}" alt="Scan to verify certificate">
                      <div class="qr-label">Scan to verify</div>
                      <div class="qr-hint">www.energyandlogics.com</div>
                    </div>`
                  : ''
              }
              <div class="date-block">
                <div class="date-value">${formattedDate}</div>
                <div class="date-rule"></div>
                <div class="date-label">${isOfficial ? 'Date of Issue' : 'Completion Date'}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <span class="cert-id">Certificate ID: <code>${certificateId}</code></span>
          ${verifyUrl && isOfficial ? `<span class="verify-line">Verify at ${verifyUrl}</span>` : ''}
          ${pendingApproval ? `<span class="verify-line">Verification available after admin approval</span>` : ''}
        </div>
      </div>

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 900);
        });
      </script>
    </body>
    </html>
  `
}
