# Setup Guide - AI Virtual Try-On Platform

Complete step-by-step guide to get the platform running.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [GPU Server Setup](#gpu-server-setup)
4. [Frontend Setup](#frontend-setup)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Python 3.10+**
- **Node.js 18+** (for web frontend)
- **Flutter 3.x** (for mobile app)
- **PostgreSQL 15**
- **Redis 7**
- **Docker & Docker Compose** (optional, recommended)

### Required Accounts
- **Google Cloud Console**: For OAuth credentials
- **AWS Account**: For S3 storage
- **GPU Server**: Vast.ai, RunPod, or AWS EC2 G5 instance

### Hardware Requirements
- **Development**: Any modern laptop/desktop
- **GPU Inference**: NVIDIA RTX 3090 / A10 / A100 (24GB+ VRAM)

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd virtual-tryon-platform
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `backend/.env`:

```bash
# Database (use Docker or local PostgreSQL)
DATABASE_URL=postgresql://vtryon:devpassword@localhost:5432/virtual_tryon

# Redis (use Docker or local Redis)
REDIS_URL=redis://localhost:6379/0

# AWS S3 (create bucket first)
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# JWT (generate random secret)
JWT_SECRET_KEY=$(openssl rand -hex 32)
```

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/google/callback`
   - `http://localhost:3000` (web frontend)
7. Copy Client ID and Client Secret to `.env`

### 5. Set Up AWS S3

```bash
# Create S3 bucket
aws s3 mb s3://your-virtual-tryon-bucket

# Set CORS policy
aws s3api put-bucket-cors --bucket your-virtual-tryon-bucket --cors-configuration file://s3-cors.json
```

Create `s3-cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 6. Start Services with Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
docker-compose logs -f postgres
# Look for: "database system is ready to accept connections"
```

### 7. Initialize Database

```bash
cd backend
python scripts/init_db.py
```

### 8. Start Backend API

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit: http://localhost:8000/docs

---

## GPU Server Setup

### Option 1: Vast.ai (Cheapest)

1. **Create Account**: https://vast.ai
2. **Search for RTX 3090**:
   - GPU: RTX 3090
   - Disk: 50GB+
   - CUDA: 11.8
3. **Launch Instance**
4. **SSH into instance**

```bash
ssh -p <port> root@<instance-ip>
```

5. **Clone repository**

```bash
git clone <repository-url>
cd virtual-tryon-platform/backend/gpu_inference
```

6. **Install CUDA 11.8** (if not pre-installed)

```bash
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_520.61.05_linux.run
sudo sh cuda_11.8.0_520.61.05_linux.run
```

7. **Install PyTorch with CUDA**

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

8. **Install dependencies**

```bash
pip install -r requirements.txt
```

9. **Download AI Models**

```bash
# SCHP
git clone https://github.com/GoGoDuck912/Self-Correction-Human-Parsing
cd Self-Correction-Human-Parsing
# Download weights from releases

# IDM-VTON
git clone https://github.com/yisol/IDM-VTON
cd IDM-VTON
python download_weights.py

# RealESRGAN
wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth
```

10. **Configure environment**

```bash
cp .env.example .env
# Edit with your credentials
```

11. **Start GPU worker**

```bash
python worker.py
```

### Option 2: RunPod

Similar to Vast.ai but with GUI:

1. Go to https://runpod.io
2. Deploy RTX 3090 pod
3. Use JupyterLab or SSH
4. Follow same steps as Vast.ai

### Option 3: AWS EC2 G5

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type g5.xlarge \
  --key-name your-key \
  --security-group-ids sg-xxx

# SSH and setup
ssh -i your-key.pem ubuntu@<instance-ip>
# Follow Vast.ai steps
```

---

## Frontend Setup

### Web Application (Next.js)

```bash
cd frontend-web

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
```

Start development server:
```bash
npm run dev
```

Visit: http://localhost:3000

### Mobile Application (Flutter)

```bash
cd frontend-mobile

# Get dependencies
flutter pub get

# Configure Google Sign-In
# 1. Download google-services.json from Firebase Console
# 2. Place in android/app/

# Run on connected device
flutter run

# Or build APK
flutter build apk --release
```

---

## Production Deployment

### Backend (AWS EC2)

```bash
# Launch EC2 t3.medium
# Install dependencies
sudo apt update
sudo apt install python3-pip postgresql-client redis-tools nginx

# Clone repository
git clone <repo> /var/www/virtual-tryon
cd /var/www/virtual-tryon/backend

# Install Python dependencies
pip install -r requirements.txt

# Configure systemd service
sudo nano /etc/systemd/system/virtual-tryon.service
```

`virtual-tryon.service`:
```ini
[Unit]
Description=Virtual Try-On API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/virtual-tryon/backend
Environment="PATH=/usr/local/bin"
ExecStart=/usr/local/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl enable virtual-tryon
sudo systemctl start virtual-tryon

# Configure nginx reverse proxy
sudo nano /etc/nginx/sites-available/virtual-tryon
```

`/etc/nginx/sites-available/virtual-tryon`:
```nginx
server {
    listen 80;
    server_name api.yourapp.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/virtual-tryon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourapp.com
```

### Web Frontend (Vercel)

```bash
cd frontend-web

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Mobile App (Google Play Store)

```bash
cd frontend-mobile

# Build release APK
flutter build apk --release

# Sign APK (create keystore first)
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# Configure signing in android/app/build.gradle
# Upload to Play Console
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
psql postgresql://vtryon:devpassword@localhost:5432/virtual_tryon
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
```

### GPU Worker Not Processing Jobs

```bash
# Check Redis queue
redis-cli
> LLEN job_queue

# Check worker logs
tail -f /var/log/gpu-worker.log

# Test pipeline manually
cd backend/gpu_inference
python pipeline.py
```

### Google OAuth Not Working

- Check redirect URIs match exactly
- Ensure credentials are in `.env`
- Check browser console for errors

### S3 Upload Failures

```bash
# Test AWS credentials
aws s3 ls s3://your-bucket

# Check CORS policy
aws s3api get-bucket-cors --bucket your-bucket
```

---

## Next Steps

1. **Test the pipeline**: Upload a test image through the API
2. **Monitor performance**: Check inference times
3. **Optimize costs**: Adjust GPU usage hours
4. **Add monitoring**: Set up Sentry, DataDog
5. **Scale**: Add more GPU workers if needed

---

## Support

- GitHub Issues: [repository-url]/issues
- Email: support@yourapp.com
- Documentation: /docs
