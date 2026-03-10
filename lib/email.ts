import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, message: string) {

  await resend.emails.send({
    from: 'Energy & Logics <energylogicsltd@gmail.com>',
    to: to,
    subject: subject,
    html: message
  })

}