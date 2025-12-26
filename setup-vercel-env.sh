#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you set up all required environment variables for Vercel deployment

echo "🚀 ECMS Vercel Environment Variables Setup"
echo "=========================================="
echo ""
echo "This script will guide you through setting up environment variables for Vercel."
echo "Make sure you have the Vercel CLI installed and are logged in."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_description=$2
    local var_example=$3
    local var_default=$4
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Setting: $var_name"
    echo "Description: $var_description"
    if [ ! -z "$var_example" ]; then
        echo "Example: $var_example"
    fi
    if [ ! -z "$var_default" ]; then
        echo "Default: $var_default"
    fi
    echo ""
    
    read -p "Enter value (or press Enter to skip): " value
    
    if [ ! -z "$value" ]; then
        echo "$value" | vercel env add "$var_name" production
        echo "✅ $var_name added"
    else
        echo "⏭️  Skipped $var_name"
    fi
    echo ""
}

# Generate random secret
generate_secret() {
    openssl rand -base64 32
}

echo "Let's start setting up your environment variables..."
echo ""

# Database Configuration
echo "🗄️  DATABASE CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
add_env_var "MONGODB_URI" \
    "MongoDB connection string" \
    "mongodb+srv://user:pass@cluster.mongodb.net/ecms" \
    ""

# Security Configuration
echo "🔐 SECURITY CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Generating SESSION_SECRET..."
SESSION_SECRET=$(generate_secret)
echo "$SESSION_SECRET" | vercel env add SESSION_SECRET production
echo "✅ SESSION_SECRET added"
echo ""

echo "Generating JWT_SECRET..."
JWT_SECRET=$(generate_secret)
echo "$JWT_SECRET" | vercel env add JWT_SECRET production
echo "✅ JWT_SECRET added"
echo ""

echo "Generating JWT_ACCESS_SECRET..."
JWT_ACCESS_SECRET=$(generate_secret)
echo "$JWT_ACCESS_SECRET" | vercel env add JWT_ACCESS_SECRET production
echo "✅ JWT_ACCESS_SECRET added"
echo ""

# Email Configuration
echo "📧 EMAIL CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Choose your email provider:"
echo "1. SendGrid (100 emails/day free)"
echo "2. Resend (100 emails/day free)"
echo "3. Brevo (300 emails/day free)"
echo "4. Gmail (testing only)"
echo "5. Custom SMTP"
echo ""

read -p "Enter choice (1-5): " email_choice

case $email_choice in
    1)
        echo "smtp.sendgrid.net" | vercel env add SMTP_HOST production
        echo "587" | vercel env add SMTP_PORT production
        echo "apikey" | vercel env add SMTP_USER production
        echo "✅ SendGrid SMTP configured"
        echo ""
        add_env_var "SMTP_PASSWORD" "Your SendGrid API Key" "SG.xxxxxxxxxxxxx" ""
        ;;
    2)
        echo "smtp.resend.com" | vercel env add SMTP_HOST production
        echo "587" | vercel env add SMTP_PORT production
        echo "resend" | vercel env add SMTP_USER production
        echo "✅ Resend SMTP configured"
        echo ""
        add_env_var "SMTP_PASSWORD" "Your Resend API Key" "re_xxxxxxxxxxxxx" ""
        ;;
    3)
        echo "smtp-relay.brevo.com" | vercel env add SMTP_HOST production
        echo "587" | vercel env add SMTP_PORT production
        echo "✅ Brevo SMTP configured"
        echo ""
        add_env_var "SMTP_USER" "Your Brevo login email" "your-email@example.com" ""
        add_env_var "SMTP_PASSWORD" "Your Brevo SMTP key" "" ""
        ;;
    4)
        echo "smtp.gmail.com" | vercel env add SMTP_HOST production
        echo "587" | vercel env add SMTP_PORT production
        echo "✅ Gmail SMTP configured"
        echo ""
        add_env_var "SMTP_USER" "Your Gmail address" "your-email@gmail.com" ""
        add_env_var "SMTP_PASSWORD" "Your Gmail App Password (16 chars)" "" ""
        ;;
    5)
        add_env_var "SMTP_HOST" "SMTP server hostname" "smtp.example.com" ""
        add_env_var "SMTP_PORT" "SMTP server port" "587" ""
        add_env_var "SMTP_USER" "SMTP username" "" ""
        add_env_var "SMTP_PASSWORD" "SMTP password" "" ""
        ;;
esac

add_env_var "SMTP_FROM_EMAIL" "Sender email address" "noreply@yourdomain.com" ""
add_env_var "SMTP_FROM_NAME" "Sender name" "ECMS Portal" "ECMS Portal"

# Optional: SMTP Security
read -p "Use SMTP_SECURE (true for port 465, false for 587)? (y/N): " use_secure
if [[ $use_secure =~ ^[Yy]$ ]]; then
    echo "false" | vercel env add SMTP_SECURE production
    echo "✅ SMTP_SECURE added"
fi
echo ""

# Application Configuration
echo "⚙️  APPLICATION CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "ECMS Portal" | vercel env add APP_NAME production
echo "✅ APP_NAME added"
echo ""

add_env_var "APP_URL" "Your Vercel deployment URL" "https://your-app.vercel.app" ""

echo "12" | vercel env add BCRYPT_ROUNDS production
echo "✅ BCRYPT_ROUNDS added"
echo ""

echo "1" | vercel env add PROFILE_UPLOAD_RETENTION_DAYS production
echo "✅ PROFILE_UPLOAD_RETENTION_DAYS added"
echo ""

echo "3600000" | vercel env add PROFILE_UPLOAD_CLEANUP_INTERVAL_MS production
echo "✅ PROFILE_UPLOAD_CLEANUP_INTERVAL_MS added"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Environment variables setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "1. Build your project: cd backend && npm run build && cd .."
echo "2. Deploy to production: vercel --prod"
echo "3. Test email functionality (password reset)"
echo ""
echo "💡 View all variables: vercel env ls"
echo "💡 View deployment logs: vercel logs --follow"
echo ""
echo "🎉 Happy deploying!"
