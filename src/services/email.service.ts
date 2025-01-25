import nodemailer from 'nodemailer';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_APP_PASSWORD || 'your-app-specific-password'
            }
        });
    }

    async sendVerificationEmail(to: string, token: string): Promise<void> {
        const verificationLink = `http://localhost:3000/api/vendor/verification/verify/${token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: 'Verify Your Business Account',
            html: `
                <h1>Business Verification</h1>
                <p>Please click the link below to verify your business account:</p>
                <a href="${verificationLink}">${verificationLink}</a>
                <p>This link will expire in 24 hours.</p>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error('Failed to send verification email');
        }
    }
}

export const emailService = new EmailService(); 