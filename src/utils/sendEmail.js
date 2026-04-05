import fetch from 'node-fetch';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM, // ✅ FIXED
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resend Error:', data);
      throw new Error('Email could not be sent');
    }

    console.log('📧 Email sent:', data.id);

    return data;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};