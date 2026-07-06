export type CertificateData = {
  fullName: string
  program: string
  completionDate: Date
  certificateId: string
  finalScore?: number | null
  /** Origin used to resolve image assets (print window has no base URL). */
  assetBaseUrl?: string
  verifyUrl?: string
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
  assetBaseUrl = '',
  verifyUrl,
}: CertificateData): string {
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
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Great+Vibes&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }

        * { box-sizing: border-box; }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
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

        /* Outer navy frame + inner gold rule */
        .frame {
          position: absolute;
          inset: 8mm;
          border: 3px solid #1e3a5f;
        }
        .frame::before {
          content: '';
          position: absolute;
          inset: 3mm;
          border: 1px solid #c9a227;
        }

        /* Corner flourishes */
        .corner {
          position: absolute;
          width: 22mm;
          height: 22mm;
          border-color: #c9a227;
          border-style: solid;
          border-width: 0;
        }
        .corner.tl { top: 13mm; left: 13mm; border-top-width: 3px; border-left-width: 3px; }
        .corner.tr { top: 13mm; right: 13mm; border-top-width: 3px; border-right-width: 3px; }
        .corner.bl { bottom: 13mm; left: 13mm; border-bottom-width: 3px; border-left-width: 3px; }
        .corner.br { bottom: 13mm; right: 13mm; border-bottom-width: 3px; border-right-width: 3px; }

        /* Watermark */
        .watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.05;
          pointer-events: none;
        }
        .watermark img { width: 150mm; }

        .content {
          position: absolute;
          inset: 14mm 20mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .logo { height: 26mm; margin-top: 2mm; }

        .cert-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 40px;
          font-weight: 700;
          color: #1e3a5f;
          letter-spacing: 5px;
          margin: 7mm 0 0;
          text-transform: uppercase;
        }

        .cert-subtitle {
          font-size: 12px;
          color: #c9a227;
          letter-spacing: 4px;
          text-transform: uppercase;
          font-weight: 600;
          margin-top: 1.5mm;
        }

        .presented {
          font-size: 12px;
          color: #555;
          margin-top: 8mm;
          letter-spacing: 1px;
        }

        .recipient {
          font-family: 'Great Vibes', cursive;
          font-size: 52px;
          color: #1e3a5f;
          margin-top: 2mm;
          line-height: 1.1;
        }

        .rule {
          width: 120mm;
          border-bottom: 1.5px solid #c9a227;
          margin-top: 1mm;
        }

        .achievement {
          font-size: 13px;
          color: #333;
          margin-top: 6mm;
          line-height: 1.7;
          max-width: 190mm;
        }

        .program-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #1e3a5f;
          margin-top: 1.5mm;
        }

        .score-line {
          font-size: 12px;
          color: #444;
          margin-top: 2mm;
        }
        .score-line strong { color: #1e3a5f; }

        .bottom-row {
          margin-top: auto;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-bottom: 2mm;
        }

        .sig-block {
          text-align: center;
          width: 70mm;
          position: relative;
        }

        .sig-name {
          font-family: 'Great Vibes', cursive;
          font-size: 30px;
          color: #16305a;
          line-height: 1;
          margin-bottom: 1mm;
        }

        .sig-rule {
          border-top: 1.5px solid #333;
          margin: 0 6mm 1.5mm;
        }

        .sig-title { font-size: 11px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; }
        .sig-org { font-size: 10px; color: #666; }

        .stamp-block {
          width: 62mm;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
        }
        .stamp-block img {
          width: 52mm;
          opacity: 0.92;
          transform: rotate(-8deg);
        }

        .date-block {
          text-align: center;
          width: 70mm;
        }
        .date-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e3a5f;
          margin-bottom: 1mm;
        }
        .date-rule { border-top: 1.5px solid #333; margin: 0 10mm 1.5mm; }
        .date-label { font-size: 11px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; }

        .footer {
          position: absolute;
          bottom: 9.5mm;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 9px;
          color: #8a8f98;
          letter-spacing: 0.5px;
        }
        .footer .cert-id { font-weight: 600; color: #5a6472; }
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
          </div>

          <div class="bottom-row">
            <div class="sig-block">
              <div class="sig-name">Elie BISAMAZA</div>
              <div class="sig-rule"></div>
              <div class="sig-title">Elie BISAMAZA</div>
              <div class="sig-org">Managing Director, Energy and Logics Ltd</div>
            </div>

            <div class="stamp-block">
              <img src="${stampUrl}" alt="Official stamp">
            </div>

            <div class="date-block">
              <div class="date-value">${formattedDate}</div>
              <div class="date-rule"></div>
              <div class="date-label">Date of Issue</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <span class="cert-id">Certificate ID: ${certificateId}</span>
          ${verifyUrl ? ` &nbsp;·&nbsp; Verify authenticity at ${verifyUrl}` : ''}
        </div>
      </div>

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 700);
        });
      </script>
    </body>
    </html>
  `
}
