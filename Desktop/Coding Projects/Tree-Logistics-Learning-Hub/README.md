# Tree Learning Hub - Driver Onboarding Platform

A comprehensive, production-ready driver learning and onboarding platform for Tree Logistics with role-based access control, multilingual support, and compliance management.

## Features

### Core Functionality
- **Role-Based Access Control (RBAC)**: Admin, Inspector, and Driver roles with granular permissions
- **Multilingual Support**: English and German (DE/EN) with next-intl
- **Authentication**: Email/password with optional 2FA (TOTP)
- **Course Management**: Courses, modules, lessons, and quizzes with progress tracking
- **Document Management**: Upload, review, approve/reject documents with expiry tracking
- **Onboarding Workflow**: 7-step visual onboarding process with status tracking
- **Gamification**: Points, badges, and leaderboards
- **Compliance**: Automated expiry checks and reminders
- **Audit Logging**: Track all sensitive operations

### Security & Compliance
- PII encryption at rest (AES-256-GCM)
- HTTPS enforcement
- Rate limiting on sensitive endpoints
- Audit logs for all critical actions
- GDPR-aware data handling
- Content Security Policy (CSP)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Server Actions & API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with 2FA support
- **Storage**: S3-compatible storage for documents
- **Background Jobs**: Inngest for scheduled tasks
- **Email/SMS**: Resend (email), Twilio (SMS)
- **Testing**: Vitest, React Testing Library, Supertest
- **i18n**: next-intl

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- AWS S3 bucket (or S3-compatible storage)
- (Optional) Resend API key for emails
- (Optional) Twilio account for SMS

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tree-learning-hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `ENCRYPTION_KEY`: Generate with `openssl rand -base64 32`
- AWS S3 credentials
- Email/SMS provider credentials

### Database Setup

1. Push the schema to your database:
```bash
npm run db:push
```

2. Run migrations (for production):
```bash
npm run db:migrate
```

3. Seed the database with sample data:
```bash
npm run db:seed
```

This creates sample users:
- **Admin**: `admin@treelogistics.com` / `Admin123!`
- **Inspector**: `inspector@treelogistics.com` / `Inspector123!`
- **Driver 1**: `driver1@example.com` / `Driver123!`
- **Driver 2**: `driver2@example.com` / `Driver123!`

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

Run tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Type checking:
```bash
npm run typecheck
```

Linting:
```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── [locale]/            # Internationalized routes
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # User dashboards
│   │   ├── admin/           # Admin pages
│   │   ├── inspector/       # Inspector pages
│   │   └── documents/       # Document management
│   └── api/                 # API routes
│       ├── auth/            # NextAuth
│       └── inngest/         # Background jobs
├── components/              # React components
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utilities and configurations
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma client
│   ├── crypto.ts           # Encryption utilities
│   ├── s3.ts               # S3 file operations
│   ├── validators.ts       # Zod schemas
│   ├── rbac.ts             # Permission checks
│   └── inngest/            # Background jobs
├── prisma/                  # Database
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── messages/                # i18n translations
│   ├── en.json
│   └── de.json
└── tests/                   # Test files
```

## Environment Variables

### Required

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: Secret for NextAuth
- `ENCRYPTION_KEY`: Key for PII encryption (min 32 chars)

### Storage (S3)

- `AWS_REGION`: AWS region
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `S3_BUCKET_NAME`: S3 bucket name
- `S3_ENDPOINT`: (Optional) For S3-compatible services

### Communication

- `RESEND_API_KEY`: Resend API key for emails
- `EMAIL_FROM`: From email address
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

### Background Jobs

- `INNGEST_EVENT_KEY`: Inngest event key
- `INNGEST_SIGNING_KEY`: Inngest signing key

## Background Jobs

The application uses Inngest for background jobs:

1. **Daily Expiry Check**: Runs at 2 AM daily to check document expiries
2. **Document Approval Handler**: Triggers on document approval
3. **Document Rejection Handler**: Triggers on document rejection
4. **Course Completion Handler**: Awards achievements and updates leaderboard
5. **Quiz Completion Handler**: Awards bonus points for perfect scores

## API Documentation

### Authentication

- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Documents

- `POST /api/documents/upload` - Upload document
- `PATCH /api/documents/:id/review` - Review document (Inspector/Admin)
- `GET /api/documents/:id/signed-url` - Get signed URL for viewing

### Courses

- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course

## Role Permissions

### Admin
- Full access to all features
- User management
- Course/quiz creation and management
- Settings configuration
- Audit log access
- Report generation and export

### Inspector
- View driver data and documents
- Approve/reject documents
- View compliance dashboards
- Access assigned drivers only

### Driver
- Complete onboarding
- Upload documents
- Take courses and quizzes
- View achievements and leaderboard
- Access own data only

## Security Best Practices

1. **PII Encryption**: Sensitive fields (SSN, Tax ID, IBAN) are encrypted at rest
2. **Audit Logging**: All sensitive operations are logged
3. **Rate Limiting**: Auth endpoints are rate-limited
4. **File Validation**: Strict file type and size validation
5. **RBAC**: Server-side permission checks on all routes
6. **2FA**: Optional/required based on role
7. **Signed URLs**: S3 documents accessible only via time-limited signed URLs

## Compliance Features

- **GDPR**: Right to erasure, data export, access logs
- **Document Expiry**: Automated tracking and reminders
- **Retention Policies**: Configurable data retention
- **Privacy**: PII redaction in logs

## Testing

The project includes:
- Unit tests for utilities and validators
- Integration tests for API endpoints
- Component tests for UI elements

Run all tests:
```bash
npm test
```

## Deployment

### Using Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Using Docker

```bash
docker build -t tree-learning-hub .
docker run -p 3000:3000 tree-learning-hub
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## CI/CD

GitHub Actions workflow is included (`.github/workflows/ci.yml`):
- Runs on push and PR
- Executes: lint, typecheck, tests, build
- Requires: PostgreSQL service for integration tests

## Support

For issues or questions, please contact the development team or create an issue in the repository.

## License

Proprietary - Tree Logistics © 2024

