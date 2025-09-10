const nodemailer = require('nodemailer');

// Your Gmail configuration
const EMAIL_CONFIG = {
  user: 'macisanmetungca@gmail.com',
  pass: 'otri xnfq mmmc mpdl'
};

// Create transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.pass
  }
});

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
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, templateType, data } = req.body;

    if (!to || !templateType || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let emailContent;
    switch (templateType) {
      case 'reviewed':
        emailContent = emailTemplates.reviewed(data.name);
        break;
      case 'approved':
        emailContent = emailTemplates.approved(data.name, data.position);
        break;
      case 'rejected':
        emailContent = emailTemplates.rejected(data.name);
        break;
      default:
        return res.status(400).json({ error: 'Invalid template type' });
    }

    const mailOptions = {
      from: `"MCC - COMSELECA" <${EMAIL_CONFIG.user}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', result.messageId);
    
    res.status(200).json({ 
      success: true, 
      messageId: result.messageId 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
