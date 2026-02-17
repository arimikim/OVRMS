# 🚀 OVRMS Deployment Guide

Complete step-by-step guide to deploy the Online Vehicle Rental and Management System

## 📋 Pre-Deployment Checklist

- [ ] Ubuntu Server 24.04 LTS or higher
- [ ] Minimum 2 vCPU, 4GB RAM, 50GB Storage
- [ ] Domain name configured (e.g., ovrms.konza.go.ke)
- [ ] SSL certificate ready (or will use Let's Encrypt)
- [ ] PostgreSQL credentials prepared
- [ ] SMTP credentials (for email notifications)

## 1️⃣ Server Setup

### Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### Install Node.js 18+

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

### Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

## 2️⃣ Database Configuration

### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE ovrms;
CREATE USER ovrms_admin WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE ovrms TO ovrms_admin;

# Grant schema permissions
\c ovrms
GRANT ALL ON SCHEMA public TO ovrms_admin;

# Exit
\q
```

### Load Database Schema

```bash
# Upload schema file to server
scp database-schema.sql user@server:/tmp/

# On server, load schema
sudo -u postgres psql -d ovrms -f /tmp/database-schema.sql

# Verify tables created
sudo -u postgres psql -d ovrms -c "\dt"
```

### Configure PostgreSQL for Remote Access (Optional)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Change listen_addresses
listen_addresses = 'localhost'  # Or '*' for all interfaces

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add authentication rules
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    ovrms          ovrms_admin      127.0.0.1/32           md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 3️⃣ Application Deployment

### Create Application User

```bash
# Create dedicated user for the application
sudo adduser --system --group --home /opt/ovrms ovrms

# Switch to application directory
cd /opt/ovrms
```

### Clone Repository

```bash
# Clone from GitHub (replace with your repo)
sudo -u ovrms git clone https://github.com/yourusername/ovrms.git .

# Or upload files directly
scp -r ovrms/* user@server:/opt/ovrms/
sudo chown -R ovrms:ovrms /opt/ovrms
```

### Install Dependencies

```bash
# Navigate to application directory
cd /opt/ovrms

# Install Node.js dependencies
sudo -u ovrms npm install --production
```

### Configure Environment

```bash
# Create .env file
sudo -u ovrms nano .env

# Add the following (customize values):
```

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ovrms
DB_USER=ovrms_admin
DB_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=generate_a_very_strong_random_secret_here_min_32_chars
JWT_EXPIRATION=24h

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://ovrms.konza.go.ke

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@konza.go.ke
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@ovrms.konza.go.ke

# Application
APP_NAME=OVRMS
APP_URL=https://ovrms.konza.go.ke
```

### Generate Secure Secrets

```bash
# Generate JWT secret (use one of these methods)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64
```

## 4️⃣ Process Manager (PM2)

### Install PM2

```bash
sudo npm install -g pm2
```

### Create PM2 Ecosystem File

```bash
sudo -u ovrms nano /opt/ovrms/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'ovrms-api',
    script: './backend-api.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
  }]
};
```

### Start Application

```bash
# Create logs directory
sudo -u ovrms mkdir -p /opt/ovrms/logs

# Start with PM2
sudo -u ovrms pm2 start ecosystem.config.js

# View status
sudo -u ovrms pm2 status

# View logs
sudo -u ovrms pm2 logs

# Save PM2 process list
sudo -u ovrms pm2 save

# Setup PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ovrms --hp /opt/ovrms
```

## 5️⃣ Nginx Reverse Proxy

### Install Nginx

```bash
sudo apt install -y nginx
```

### Configure Nginx

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/ovrms
```

```nginx
upstream ovrms_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name ovrms.konza.go.ke;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/ovrms.access.log;
    error_log /var/log/nginx/ovrms.error.log;

    # API proxy
    location /api {
        proxy_pass http://ovrms_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend static files
    location / {
        root /opt/ovrms/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        proxy_pass http://ovrms_backend;
        access_log off;
    }
}
```

### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ovrms /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 6️⃣ SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain Certificate

```bash
# Get certificate and auto-configure Nginx
sudo certbot --nginx -d ovrms.konza.go.ke

# Follow prompts:
# 1. Enter email address
# 2. Agree to terms
# 3. Choose redirect option (recommended: 2)
```

### Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
# Verify cron job:
sudo systemctl status certbot.timer
```

## 7️⃣ Firewall Configuration

### Configure UFW

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

## 8️⃣ Monitoring & Logging

### Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/ovrms
```

```
/opt/ovrms/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

### Install Monitoring Tools

```bash
# Install htop for process monitoring
sudo apt install -y htop

# Install PostgreSQL monitoring
sudo apt install -y postgresql-contrib
```

### PM2 Monitoring

```bash
# View real-time monitoring
sudo -u ovrms pm2 monit

# Web-based monitoring (optional)
sudo -u ovrms pm2 plus
```

## 9️⃣ Backup Strategy

### Database Backup Script

```bash
sudo nano /opt/ovrms/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/ovrms/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ovrms"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/ovrms_$DATE.sql.gz

# Remove backups older than 30 days
find $BACKUP_DIR -name "ovrms_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ovrms_$DATE.sql.gz"
```

```bash
# Make executable
sudo chmod +x /opt/ovrms/scripts/backup-db.sh

# Add to cron (daily at 2 AM)
sudo crontab -e

# Add line:
0 2 * * * /opt/ovrms/scripts/backup-db.sh
```

## 🔟 Post-Deployment Tasks

### Create Admin User

```bash
# Connect to database
sudo -u postgres psql -d ovrms

# Insert admin user (update password hash)
INSERT INTO users (username, email, password_hash, full_name, phone_number, role, organization)
VALUES (
    'admin',
    'admin@konza.go.ke',
    '$2b$12$your_bcrypt_hash_here',  -- Generate using bcrypt
    'System Administrator',
    '+254700000000',
    'admin',
    'KoTDA Operations'
);
```

### Generate Admin Password Hash

```bash
# Create Node.js script
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword123!', 12, (err, hash) => console.log(hash));"
```

### Test Application

```bash
# Check if app is running
curl http://localhost:3000/health

# Check through Nginx
curl https://ovrms.konza.go.ke/health

# Test login API
curl -X POST https://ovrms.konza.go.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword123!"}'
```

## 🛡️ Security Hardening

### 1. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config

# Change:
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys

sudo systemctl restart sshd
```

### 2. Setup Fail2Ban

```bash
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Enable SSH protection
[sshd]
enabled = true
```

### 3. PostgreSQL Security

```bash
# Secure PostgreSQL
sudo -u postgres psql

# Set strong password for postgres user
ALTER USER postgres WITH PASSWORD 'very_strong_password';

# Restrict network access in pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

### 4. Regular Updates

```bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Maintenance Commands

```bash
# Restart application
sudo -u ovrms pm2 restart all

# View logs
sudo -u ovrms pm2 logs

# Check app status
sudo -u ovrms pm2 status

# Database backup
/opt/ovrms/scripts/backup-db.sh

# Check disk usage
df -h

# Monitor system resources
htop

# Check Nginx logs
sudo tail -f /var/log/nginx/ovrms.access.log
sudo tail -f /var/log/nginx/ovrms.error.log

# Restart Nginx
sudo systemctl restart nginx

# Check SSL certificate expiry
sudo certbot certificates
```

## 🚨 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
sudo -u ovrms pm2 logs

# Check for port conflicts
sudo lsof -i :3000

# Verify environment variables
sudo -u ovrms pm2 env 0
```

### Database Connection Issues

```bash
# Test database connection
sudo -u postgres psql -d ovrms -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Nginx Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Test certificate
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

## 📞 Support & Resources

- **Application Logs**: `/opt/ovrms/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`
- **PM2 Logs**: `pm2 logs`

## ✅ Deployment Checklist

- [ ] Server provisioned and updated
- [ ] Node.js and PostgreSQL installed
- [ ] Database created and schema loaded
- [ ] Application files uploaded
- [ ] Environment variables configured
- [ ] PM2 process manager configured
- [ ] Nginx reverse proxy setup
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup script configured
- [ ] Admin user created
- [ ] Application tested end-to-end
- [ ] Monitoring enabled
- [ ] Documentation updated

---

**Deployment Complete! 🎉**

Your OVRMS application should now be running at https://ovrms.konza.go.ke
