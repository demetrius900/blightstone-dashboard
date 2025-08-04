const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
    constructor() {
        this.fromEmail = 'noreply@blightstone.com'; // You'll need to verify this domain in Resend
    }

    async sendTeamInvite({ email, inviterName, organizationName, inviteToken }) {
        const appUrl = process.env.APP_URL || 'http://localhost:8000';
        const inviteUrl = `${appUrl}/auth-register?invite=${inviteToken}`;

        try {
            const { data, error } = await resend.emails.send({
                from: this.fromEmail,
                to: [email],
                subject: `You've been invited to join ${organizationName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">🗲 Blightstone</h1>
                        </div>
                        
                        <div style="padding: 30px;">
                            <h2>You've been invited to join ${organizationName}</h2>
                            
                            <p>Hi there!</p>
                            
                            <p><strong>${inviterName}</strong> has invited you to join their team on Blightstone, a powerful project management platform.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${inviteUrl}" 
                                   style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                    Accept Invitation
                                </a>
                            </div>
                            
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
                                ${inviteUrl}
                            </p>
                            
                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                            </p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                            © 2025 Blightstone. All rights reserved.
                        </div>
                    </div>
                `
            });

            if (error) {
                console.error('Resend error:', error);
                throw new Error('Failed to send invitation email');
            }

            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('Email service error:', error);
            throw error;
        }
    }

    async sendPasswordReset({ email, resetToken }) {
        const appUrl = process.env.APP_URL || 'http://localhost:8000';
        const resetUrl = `${appUrl}/auth-reset-password?token=${resetToken}`;

        try {
            const { data, error } = await resend.emails.send({
                from: this.fromEmail,
                to: [email],
                subject: 'Reset your Blightstone password',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">🗲 Blightstone</h1>
                        </div>
                        
                        <div style="padding: 30px;">
                            <h2>Reset your password</h2>
                            
                            <p>You requested to reset your password for your Blightstone account.</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" 
                                   style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                    Reset Password
                                </a>
                            </div>
                            
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
                                ${resetUrl}
                            </p>
                            
                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                                This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
                            </p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                            © 2025 Blightstone. All rights reserved.
                        </div>
                    </div>
                `
            });

            if (error) {
                console.error('Resend error:', error);
                throw new Error('Failed to send password reset email');
            }

            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('Email service error:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();