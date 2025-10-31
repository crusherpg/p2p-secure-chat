#!/bin/bash

# P2P Secure Chat Deployment Script
# This script automates the deployment process on Ubuntu 24.04 LTS

set -e

echo "🚀 Starting P2P Secure Chat deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
print_status "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
print_status "Installing MongoDB..."
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Nginx and Certbot
print_status "Installing Nginx and Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2

# Start and enable MongoDB
print_status "Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Clone repository (if not already present)
if [ ! -d "p2p-secure-chat" ]; then
    print_status "Cloning P2P Secure Chat repository..."
    git clone https://github.com/crusherpg/p2p-secure-chat.git
fi

cd p2p-secure-chat

# Install dependencies
print_status "Installing dependencies..."
npm run install:all

# Build client
print_status "Building client application..."
npm run build

# Create environment file
if [ ! -f ".env" ]; then
    print_status "Creating environment file..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before starting the server"
fi

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
sudo cp nginx/p2p.conf /etc/nginx/sites-available/p2p
sudo ln -sf /etc/nginx/sites-available/p2p /etc/nginx/sites-enabled/
sudo nginx -t

# Create log directories
mkdir -p server/logs

print_success "Deployment completed successfully!"
print_warning "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Configure your domain in nginx/p2p.conf"
echo "3. Run: sudo systemctl restart nginx"
echo "4. Setup SSL: sudo certbot --nginx -d yourdomain.com"
echo "5. Start the application: pm2 start ecosystem.config.js --env production"
echo "6. Save PM2 configuration: pm2 startup && pm2 save"

print_status "P2P Secure Chat is ready to launch! 🎉"