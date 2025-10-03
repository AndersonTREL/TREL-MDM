# Email Notification Setup

The document approval/rejection system includes email notifications. Here's how to configure it:

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (using Resend - recommended)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Alternative: SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

## Setup Options

### Option 1: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add `RESEND_API_KEY` to your `.env` file
4. Set `EMAIL_FROM` to your verified domain

### Option 2: Gmail SMTP
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Use your Gmail credentials with the App Password

### Option 3: Other SMTP Providers
- **SendGrid**: Use their SMTP settings
- **Mailgun**: Use their SMTP settings
- **AWS SES**: Use their SMTP settings

## Testing

The system will work in "stub mode" without email configuration - notifications will be logged to console instead of sent via email.

## Email Templates

The system sends these types of emails:
- **Document Approved**: When a document is approved
- **Document Rejected**: When a document is rejected (includes reason)

Both emails include:
- Document type and status
- Reviewer information
- Review date
- Next steps (for rejections)
