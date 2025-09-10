// Email configuration
const EMAIL_CONFIG = {
  user: 'macisanmetungca@gmail.com',
  pass: 'otri xnfq mmmc mpdl'
}

// Email templates
const emailTemplates = {
  reviewed: (name) => ({
    subject: 'Candidacy Application Status',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a365d;">Candidacy Application Status</h2>
        
        <p>Dear Mr./Ms. ${name},</p>
        
        <p>We hope this message finds you well. We want to express our deepest appreciation for having an interest in serving and leading our college.</p>
        
        <p>We would like to inform you that your candidacy application in the upcoming Student Council Elections has been reviewed by the Commission on Student Elections and Appointments.</p>
        
        <p>At this stage, you can now make an appointment for the screening process at <a href="https://macisanmetungca.vercel.app" style="color: #dc2626;">macisanmetungca.vercel.app</a> as part of the evaluation process.</p>
        
        <p><strong>Your attendance is a must.</strong> Please bring all physical copies of your submitted requirements. Failure to attend may affect your application status.</p>
        
        <p>Should you have any questions, please contact us through <a href="mailto:comseleca@mcc.edu.ph" style="color: #dc2626;">comseleca@mcc.edu.ph</a>.</p>
        
        <p>Very Truly Yours,<br>
        <strong>MCC – COMSELECA</strong></p>
      </div>
    `
  }),

  approved: (name, position) => ({
    subject: 'Result of the Student Leader Screening Process',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a365d;">Result of the Student Leader Screening Process</h2>
        
        <p>Dear Mr./Ms. ${name},</p>
        
        <p>We hope this message finds you well. We want to express our deepest appreciation for showing positive participation throughout the screening process and for having an interest in serving and leading our college.</p>
        
        <p>After a thorough and careful deliberation, we are delighted to extend our heartfelt congratulations to you on successfully passing the screening process to become a <strong>${position}</strong>. Your dedication, enthusiasm, and commitment to making a positive impact on our college have not gone unnoticed.</p>
        
        <p>Your accomplishment in securing this important role is a testament to your exceptional leadership qualities, integrity, and unwavering passion for representing the voices of your fellow students. Your vision for the future and your willingness to serve as a role model are truly commendable.</p>
        
        <p>Once again, congratulations on this well-deserved achievement. We look forward to witnessing the positive impact you will undoubtedly make as a student leader.</p>
        
        <p>Best wishes for a fulfilling and successful tenure ahead.</p>
        
        <p>Should you have any questions, please contact us through <a href="mailto:comseleca@mcc.edu.ph" style="color: #dc2626;">comseleca@mcc.edu.ph</a>.</p>
        
        <p>Very Truly Yours,<br>
        <strong>MCC – COMSELECA</strong></p>
      </div>
    `
  }),

  rejected: (name) => ({
    subject: 'Result of the Student Leader Screening Process',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a365d;">Result of the Student Leader Screening Process</h2>
        
        <p>Dear Mr./Ms. ${name},</p>
        
        <p>We regret to inform you that you have not been chosen to advance as a future student leader following a thorough and rigorous screening. We want to inform you that this outcome was reached after careful consideration and evaluation.</p>
        
        <p>Regardless of the outcome, we'd like to emphasize how much we valued your application and participation in our process. May you continue to contribute to our college and community in ways that are in line with your abilities and aspirations.</p>
        
        <p>Once again, we appreciate your enthusiasm and dedication throughout the screening process.</p>
        
        <p>Best wishes for a fulfilling and successful tenure ahead.</p>
        
        <p>Should you have any questions, please contact us through <a href="mailto:comseleca@mcc.edu.ph" style="color: #dc2626;">comseleca@mcc.edu.ph</a>.</p>
        
        <p>Very Truly Yours,<br>
        <strong>MCC – COMSELECA</strong></p>
      </div>
    `
  })
}

// Send email function - creates a copyable email for manual sending
export const sendEmail = async (to, templateType, data) => {
  try {
    let emailContent
    switch (templateType) {
      case 'reviewed':
        emailContent = emailTemplates.reviewed(data.name)
        break
      case 'approved':
        emailContent = emailTemplates.approved(data.name, data.position)
        break
      case 'rejected':
        emailContent = emailTemplates.rejected(data.name)
        break
      default:
        throw new Error('Invalid template type')
    }

    // Convert HTML to plain text for email body
    const plainTextBody = emailContent.html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()

    // Create a modal or alert with the email content
    const emailText = `
TO: ${to}
SUBJECT: ${emailContent.subject}

${plainTextBody}

---
This email was generated by MaCisanmetungCa System
Please copy and send this email manually.
    `.trim()

    // Show the email content in a modal-like alert
    const shouldSend = confirm(`Email ready to send to ${to}:\n\n${emailText}\n\nClick OK to copy to clipboard, or Cancel to skip.`)
    
    if (shouldSend) {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(emailText)
        alert('Email content copied to clipboard! You can now paste it into your email client.')
      } catch (clipboardError) {
        // Fallback: show in a new window
        const newWindow = window.open('', '_blank')
        newWindow.document.write(`
          <html>
            <head><title>Email to Send</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Email to Send</h2>
              <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${emailText}</pre>
              <p><strong>Instructions:</strong> Copy the text above and paste it into your email client.</p>
            </body>
          </html>
        `)
      }
    }

    // Also log to console
    console.log('=== EMAIL TO SEND ===')
    console.log('To:', to)
    console.log('Subject:', emailContent.subject)
    console.log('Body:', plainTextBody)
    console.log('====================')

    return { success: true, messageId: 'email-prepared' }
  } catch (error) {
    console.error('Error preparing email:', error)
    return { success: false, error: error.message }
  }
}

// Send candidacy status email
export const sendCandidacyStatusEmail = async (email, name, status, position = null) => {
  const data = { name, position }
  return await sendEmail(email, status, data)
}
