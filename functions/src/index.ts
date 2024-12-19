import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Configure nodemailer with your SMTP settings
const transporter = nodemailer.createTransport({
  // Configure with your email service (Gmail, SendGrid, etc.)
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

export const sendTeamInvitationEmail = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { email, teamOwnerName, companyName } = data;

  const mailOptions = {
    from: `${companyName} <noreply@yourdomain.com>`,
    to: email,
    subject: `Join ${companyName}'s Team on Stack Assist`,
    html: `
      <h2>Welcome to Stack Assist!</h2>
      <p>You've been invited to join ${companyName}'s team by ${teamOwnerName}.</p>
      
      <p>You'll receive a separate email with a link to set up your password. Please follow these steps:</p>
      
      <ol>
        <li>Click the password reset link in the other email</li>
        <li>Set your secure password</li>
        <li>Log in at ${functions.config().app.url}</li>
      </ol>
      
      <p>This invitation will expire in 24 hours for security reasons.</p>
      
      <p>If you have any questions, please contact your team owner at ${teamOwnerName}.</p>
      
      <p>Best regards,<br>The Stack Assist Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Error sending email');
  }
});

// Optional: Log when a new team member is created
export const onTeamMemberCreated = functions.firestore
  .document('team/{memberId}')
  .onCreate(async (snap, context) => {
    const newMember = snap.data();
    
    // Log the creation
    console.log(`New team member created: ${newMember.email}`);
    
    // You could add additional logic here, like:
    // - Sending welcome emails
    // - Creating additional resources
    // - Updating statistics
  });