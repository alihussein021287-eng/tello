#!/bin/bash
# Tello — VPS Setup Script
# Run as root on Ubuntu 22.04/24.04

set -e
echo "🚀 Setting up Tello on VPS..."

# 1. Update system
apt update && apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 3. Install Docker Compose
apt install -y docker-compose-plugin

# 4. Install Certbot for SSL
apt install -y certbot

# 5. Get SSL certificate
# Replace with your actual domain
certbot certonly --standalone -d fshsmart.com -d www.fshsmart.com \
  -d api.fshsmart.com -d admin.fshsmart.com -d storage.fshsmart.com \
  --non-interactive --agree-tos -m admin@fshsmart.com

# 6. Auto-renew SSL
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 7. Copy env file
cp .env.example .env
echo ""
echo "⚠️  Edit .env file with your passwords before continuing!"
echo "   nano .env"
echo ""
echo "Then run: docker compose up -d"
echo ""
echo "✅ VPS setup complete!"
