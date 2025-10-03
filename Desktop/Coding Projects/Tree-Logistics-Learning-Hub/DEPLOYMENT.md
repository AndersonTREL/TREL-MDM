# Deployment Guide

This guide covers deployment options for the Tree Learning Hub application.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- S3-compatible storage (AWS S3, MinIO, etc.)
- (Optional) Redis for distributed rate limiting
- (Optional) Email/SMS provider credentials

## Environment Variables

Before deploying, ensure all environment variables are properly configured. See `env.example` for a complete list.

### Critical Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"

# Encryption (for PII)
ENCRYPTION_KEY="generate-a-secure-32-char-key"

# S3 Storage
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
S3_BUCKET_NAME="your-bucket"

# Background Jobs
INNGEST_EVENT_KEY="your-inngest-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
```

## Deployment Options

### 1. Vercel (Recommended for Quick Deploy)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

**Database Setup:**
- Use a managed PostgreSQL (Vercel Postgres, Supabase, Railway, etc.)
- Run migrations: `npx prisma migrate deploy`
- Seed database: `npm run db:seed`

### 2. Docker Deployment

#### Build and Run

```bash
# Build image
docker build -t tree-learning-hub .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="..." \
  tree-learning-hub
```

#### Using Docker Compose

```bash
# Start all services (app, postgres, redis)
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed database
docker-compose exec app npm run db:seed

# View logs
docker-compose logs -f app
```

### 3. Traditional VPS/Server

#### Setup Steps

1. **Install Dependencies**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql
```

2. **Clone and Install**
```bash
git clone <repository>
cd tree-learning-hub
npm ci
```

3. **Configure Environment**
```bash
cp env.example .env
# Edit .env with your values
nano .env
```

4. **Setup Database**
```bash
# Create database
sudo -u postgres createdb tree_learning_hub

# Run migrations
npx prisma migrate deploy

# Seed
npm run db:seed
```

5. **Build Application**
```bash
npm run build
```

6. **Run with PM2**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "tree-learning-hub" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 4. AWS Deployment

#### Using EC2 + RDS + S3

1. **RDS Setup**
   - Create PostgreSQL RDS instance
   - Note connection string

2. **S3 Setup**
   - Create S3 bucket
   - Configure CORS for file uploads
   - Create IAM user with S3 access
   - Note access keys

3. **EC2 Setup**
   - Launch EC2 instance (Ubuntu 22.04)
   - Install Node.js and dependencies
   - Clone repository
   - Configure environment variables
   - Setup Nginx as reverse proxy
   - Configure SSL with Let's Encrypt

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests (if provided), or create:

- Deployment
- Service
- Ingress
- ConfigMap for environment variables
- Secret for sensitive data

Example deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tree-learning-hub
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tree-learning-hub
  template:
    metadata:
      labels:
        app: tree-learning-hub
    spec:
      containers:
      - name: app
        image: tree-learning-hub:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
```

## Post-Deployment

### 1. Database Migrations

Always run migrations after deployment:

```bash
npx prisma migrate deploy
```

### 2. Seed Initial Data (First Deploy Only)

```bash
npm run db:seed
```

This creates:
- Admin user: `admin@treelogistics.com` / `Admin123!`
- Inspector user: `inspector@treelogistics.com` / `Inspector123!`
- Sample drivers and courses

**⚠️ Change default passwords immediately in production!**

### 3. Background Jobs

Ensure Inngest is configured and running for:
- Daily document expiry checks
- Automated notifications
- Achievement processing

### 4. Monitoring

Recommended monitoring setup:
- Application logs (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- Uptime monitoring (Pingdom, UptimeRobot)

### 5. Backups

Setup automated backups:
- Database: Daily PostgreSQL backups
- S3: Enable versioning and lifecycle policies
- Audit logs: Archive to cold storage

## Scaling

### Horizontal Scaling

The application is stateless and can be scaled horizontally:

```bash
# Docker
docker-compose up -d --scale app=3

# Kubernetes
kubectl scale deployment tree-learning-hub --replicas=5
```

### Database Scaling

- Enable read replicas for read-heavy operations
- Use connection pooling (PgBouncer)
- Consider database sharding for large datasets

### CDN

Serve static assets through CDN:
- Configure Next.js Image Optimization
- Use CloudFront/CloudFlare for global distribution

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check network/firewall rules
   - Ensure PostgreSQL is running

2. **File Upload Failures**
   - Verify S3 credentials
   - Check bucket permissions
   - Ensure CORS is configured

3. **Background Jobs Not Running**
   - Verify Inngest configuration
   - Check Inngest dashboard for errors
   - Ensure event keys are correct

4. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches domain
   - Clear cookies and retry

### Logs

View application logs:

```bash
# Docker
docker-compose logs -f app

# PM2
pm2 logs tree-learning-hub

# Systemd
journalctl -u tree-learning-hub -f
```

## Security Checklist

- [ ] Change default admin passwords
- [ ] Enable 2FA for admin accounts
- [ ] Configure HTTPS/SSL
- [ ] Set secure NEXTAUTH_SECRET
- [ ] Rotate encryption keys regularly
- [ ] Enable rate limiting
- [ ] Configure CSP headers
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Audit logs monitoring

## Performance Optimization

1. **Caching**
   - Enable Redis for session storage
   - Configure Next.js ISR where appropriate
   - Use CDN for static assets

2. **Database**
   - Add indexes on frequently queried fields
   - Use database query optimization
   - Enable connection pooling

3. **Assets**
   - Optimize images with Next.js Image
   - Minify CSS/JS (handled by Next.js)
   - Enable compression (gzip/brotli)

## Support

For deployment issues:
1. Check logs for specific errors
2. Review environment variables
3. Consult this guide and README
4. Contact development team

## Maintenance

### Regular Tasks

- Weekly: Review audit logs
- Monthly: Database optimization (VACUUM)
- Quarterly: Security audit
- As needed: Update dependencies

