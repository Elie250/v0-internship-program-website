import * as fs from 'fs'
import * as path from 'path'

interface CertificateData {
  fullName: string
  program: string
  completionDate: Date
  certificateId: string
}

export async function generateCertificate({
  fullName,
  program,
  completionDate,
  certificateId,
}: CertificateData): Promise<Buffer> {
  // Create SVG certificate as a buffer
  const svg = createCertificateSVG({
    fullName,
    program,
    completionDate,
    certificateId,
  })

  // Convert SVG to PNG/PDF using canvas
  // For this implementation, we'll return SVG as HTML that can be printed
  return Buffer.from(svg, 'utf-8')
}

function createCertificateSVG({
  fullName,
  program,
  completionDate,
  certificateId,
}: CertificateData): string {
  const formattedDate = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate of Completion</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: white;
        }
        
        .certificate {
          width: 297mm;
          height: 210mm;
          position: relative;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 0;
          margin: 0;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .certificate-content {
          width: 95%;
          height: 95%;
          border: 3px solid #0066cc;
          background: white;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          box-sizing: border-box;
          text-align: center;
        }
        
        .certificate-content::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 1px solid #0066cc;
          opacity: 0.3;
          pointer-events: none;
        }
        
        .certificate-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .logo-section {
          margin-bottom: 20px;
        }
        
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #0066cc;
          letter-spacing: 2px;
        }
        
        .tagline {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        
        h1 {
          font-size: 48px;
          color: #0066cc;
          margin: 30px 0 10px 0;
          font-weight: 700;
        }
        
        .subtitle {
          font-size: 16px;
          color: #333;
          margin-bottom: 30px;
          font-weight: 500;
        }
        
        .recipient {
          margin: 30px 0;
        }
        
        .recipient-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .recipient-name {
          font-size: 32px;
          color: #0066cc;
          font-weight: 700;
          margin-bottom: 5px;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 10px;
          min-width: 400px;
        }
        
        .achievement {
          font-size: 14px;
          color: #333;
          margin: 20px 0;
          line-height: 1.6;
        }
        
        .program-name {
          font-size: 16px;
          color: #0066cc;
          font-weight: 600;
          margin: 10px 0;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-around;
          width: 100%;
          margin-top: 40px;
          align-items: flex-end;
        }
        
        .signature-block {
          text-align: center;
          width: 150px;
        }
        
        .signature-line {
          border-top: 2px solid #333;
          margin-bottom: 5px;
          min-height: 40px;
        }
        
        .signature-title {
          font-size: 11px;
          color: #333;
          font-weight: 600;
        }
        
        .footer {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #999;
        }
        
        .certificate-id {
          font-size: 10px;
          color: #999;
        }
        
        .date {
          font-size: 10px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-content">
          <div class="certificate-inner">
            <div class="logo-section">
              <div class="logo">⚡ ENERGY & LOGICS</div>
              <div class="tagline">Professional Training & Development</div>
            </div>
            
            <h1>CERTIFICATE OF COMPLETION</h1>
            <div class="subtitle">This is to certify that</div>
            
            <div class="recipient">
              <div class="recipient-label">This certificate is proudly presented to</div>
              <div class="recipient-name">${fullName}</div>
            </div>
            
            <div class="achievement">
              <p>has successfully completed the training program:</p>
              <div class="program-name">${program}</div>
              <p>and demonstrated the knowledge, skills, and competencies required to excel in this field.</p>
            </div>
            
            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-title">Director</div>
                <div class="signature-title">Energy & Logics</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-title">Authorized By</div>
                <div class="signature-title">Program Coordinator</div>
              </div>
            </div>
            
            <div class="footer">
              <div class="certificate-id">Certificate ID: ${certificateId}</div>
              <div class="date">Date: ${formattedDate}</div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        // Auto-print when loaded
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 500);
        });
      </script>
    </body>
    </html>
  `
}

export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CERT-${timestamp}-${random}`
}
