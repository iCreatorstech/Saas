import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail, ActionCodeSettings } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const actionCodeSettings: ActionCodeSettings = {
  url: window.location.origin + '/login',
  handleCodeInApp: true,
};

export const sendTeamInvitationEmail = async (
  email: string,
  teamOwnerName: string,
  companyName: string
) => {
  const auth = getAuth();
  
  try {
    // Send password reset email with custom template
    await sendPasswordResetEmail(auth, email, {
      ...actionCodeSettings,
      // Firebase will use these URL parameters in the email template
      url: `${window.location.origin}/login?email=${encodeURIComponent(email)}&type=team-invitation&owner=${encodeURIComponent(teamOwnerName)}&company=${encodeURIComponent(companyName)}`,
    });

    // If you're using Firebase Cloud Functions, you can also trigger a custom email
    const functions = getFunctions();
    const sendCustomEmail = httpsCallable(functions, 'sendTeamInvitationEmail');
    await sendCustomEmail({
      email,
      teamOwnerName,
      companyName,
    });

    return true;
  } catch (error) {
    console.error('Error sending team invitation email:', error);
    throw error;
  }
};