import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailParams {
  to: string
  full_name: string
  program: string
  status: 'accepted' | 'declined'
}

export async function sendApplicationEmail({
  to,
  full_name,
  program,
  status,
}: EmailParams) {
  try {
    if (status === 'accepted') {
      await resend.emails.send({
        from: 'Energy & Logics <noreply@energyandlogics.com>',
        to,
        subject: 'Congratulations! Your Application Has Been Accepted',
        html: acceptanceEmailTemplate(full_name, program),
      })
    } else {
      await resend.emails.send({
        from: 'Energy & Logics <noreply@energyandlogics.com>',
        to,
        subject: 'Application Status Update',
        html: declineEmailTemplate(full_name, program),
      })
    }

    return { success: true }
  } catch (error) {
    console.error(`[v0] Email send failed for ${to}:`, error)
    return { success: false, error }
  }
}

function acceptanceEmailTemplate(name: string, program: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .button { background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          h1 { margin: 0 0 10px 0; }
          .highlight { color: #0066cc; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Congratulations, ${name}!</h1>
            <p>Your application has been accepted</p>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>We are excited to inform you that your application for the <span class="highlight">${program}</span> program has been <span class="highlight">accepted</span>!</p>
            <p>This is a great achievement, and we believe you have the potential to excel in this program. Your dedication and effort have impressed our review team.</p>
            <h3>Next Steps:</h3>
            <ul>
              <li>Check your email for enrollment instructions</li>
              <li>Review the program schedule and requirements</li>
              <li>Prepare your learning materials</li>
              <li>Contact our support team if you have any questions</li>
            </ul>
            <p>We look forward to having you as part of our learning community!</p>
            <p><strong>Energy & Logics Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Energy & Logics. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

function declineEmailTemplate(name: string, program: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #666666 0%, #4a4a4a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          h1 { margin: 0 0 10px 0; }
          .highlight { color: #666666; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Status Update</h1>
            <p>For ${program} Program</p>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for your interest in the <span class="highlight">${program}</span> program at Energy & Logics. We appreciate the time and effort you invested in your application.</p>
            <p>After careful review, we regret to inform you that your application was not selected for this program at this time. This decision does not reflect your abilities or potential, as we receive many qualified applications and can only accept a limited number.</p>
            <h3>What You Can Do Next:</h3>
            <ul>
              <li>Consider applying for other programs we offer</li>
              <li>Strengthen your skills and experience</li>
              <li>Reapply for this program in the future</li>
              <li>Reach out to our team for feedback and guidance</li>
            </ul>
            <p>We encourage you not to be discouraged. Many successful professionals faced similar rejections early in their journey. We wish you the best in your future endeavors and hope to see you in one of our programs soon.</p>
            <p><strong>Energy & Logics Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Energy & Logics. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
