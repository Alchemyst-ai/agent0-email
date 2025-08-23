# Email Agent

AI-powered email management system with automated replies and email generation.

## Features

- **Send Emails**: Generate and send emails using AI
- **Check Inbox**: View incoming emails with IMAP
- **AI Replies**: Automatically generate and send replies

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with your configuration:
```env
OPENAI_API_KEY=your_openai_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASS=your_app_password
IMAP_TLS=true
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Usage

- **Check Inbox**: Click "Check New Emails" to fetch recent emails
- **Send Replies**: Use the AI Reply tab to generate and send responses
- **Send Emails**: Use the Send Emails tab to create and send new emails
