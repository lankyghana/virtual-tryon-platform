# AI Virtual Try-On Platform

Production-ready virtual try-on platform with diffusion-based AI for Android and Web.

## Features

- 🎨 **Realistic Try-On**: IDM-VTON diffusion model for photorealistic results
- 📱 **Cross-Platform**: Android APK (Flutter) + Web App (Next.js)
- 🔐 **Google OAuth**: Secure authentication
- ⚡ **Async Processing**: Job queue system for 10-20 second processing
- 🖼️ **Gallery**: Save and manage all your try-on results
- 🎯 **Rate Limiting**: Quota management for free/pro users

## Architecture

```
├── backend/              # FastAPI backend
│   ├── app/             # Main API service
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── routers/     # API endpoints
│   │   ├── services/    # Business logic
│   │   └── utils/       # Helpers
│   └── gpu_inference/   # GPU worker service
│       ├── pipeline.py  # AI pipeline
│       └── worker.py    # Queue consumer
├── frontend-web/        # Next.js web app
├── frontend-mobile/     # Flutter Android app
└── docs/               # Documentation
```

## Tech Stack

### Backend
- **API Framework**: FastAPI 0.108+
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Storage**: AWS S3 / Cloudflare R2
- **Auth**: Google OAuth 2.0 + JWT

### AI/ML
- **SCHP**: Human parsing (body segmentation)
- **OpenPose**: Pose estimation
- **IDM-VTON**: Diffusion-based try-on (core)
- **RealESRGAN**: HD upscaling
- **Framework**: PyTorch 2.0+, CUDA 11.8

### Frontend
- **Web**: Next.js 14, TypeScript, Tailwind CSS
- **Mobile**: Flutter 3.x, Dart

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Flutter 3.x
- PostgreSQL 15
- Redis 7
- NVIDIA GPU (RTX 3090 or A10 recommended)
- CUDA 11.8

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Initialize database
python scripts/init_db.py

# Run migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. GPU Inference Service Setup

```bash
cd backend/gpu_inference

# Install PyTorch with CUDA
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Install AI dependencies
pip install -r requirements.txt

# Download model weights
python download_models.py

# Start worker
python worker.py
```

### Production Try-On Pipeline (SCHP + Pose + VTON)

The worker supports a production pipeline mode that enforces proper mask logic:

1. SCHP parsing (face/hair/arms/torso masks)
2. Clothing-agnostic person generation
3. Garment mask extraction
4. Pose map conditioning
5. Real VTON synthesis command (IDM-VTON/CatVTON)
6. Face/hair/arms protection compositing

Set these GPU worker environment variables:

```bash
TRYON_PIPELINE_MODE=production
SCHP_LABELMAP_COMMAND_TEMPLATE="python schp_infer.py --input {person_image} --output {output_labelmap}"
POSE_MAP_COMMAND_TEMPLATE="python pose_infer.py --input {person_image} --output {output_pose}"
VTON_COMMAND_TEMPLATE="python inference.py --person {person_agnostic} --cloth {garment_image} --cloth-mask {garment_mask} --pose {pose_map} --edit-mask {edit_mask} --output {output_path}"
VTON_WORKDIR="/path/to/your/vton/repo"
```

Notes:
- Use an open-source VTON backend such as IDM-VTON or CatVTON.
- `{...}` placeholders are required and injected by the worker.
- If `VTON_COMMAND_TEMPLATE` is not set, the worker uses a non-production fallback.

### 3. Web Frontend Setup

```bash
cd frontend-web

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with API URL

# Run development server
npm run dev
```

### 4. Mobile App Setup

```bash
cd frontend-mobile

# Get dependencies
flutter pub get

# Configure Google OAuth
# Edit android/app/google-services.json

# Run on connected device
flutter run
```

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/virtual_tryon
REDIS_URL=redis://localhost:6379/0
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET_KEY=your_random_secret_key
```

### GPU Inference (.env)

```
REDIS_URL=redis://localhost:6379/0
AWS_S3_BUCKET=your-bucket-name
MODEL_CACHE_DIR=/models
CUDA_VISIBLE_DEVICES=0
```

### Web Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## Deployment

### GPU Server (Vast.ai / RunPod)

```bash
# Launch RTX 3090 instance
# Install CUDA 11.8 + cuDNN
# Clone repository
# Run gpu_inference/worker.py
```

### Backend (AWS EC2 / DigitalOcean)

```bash
# Launch t3.medium instance
# Install dependencies
# Set up systemd service
# Configure nginx reverse proxy
```

### Web (Vercel)

```bash
cd frontend-web
vercel --prod
```

### Mobile (Google Play Store)

```bash
cd frontend-mobile
flutter build apk --release
# Upload to Play Console
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Cost Estimate

### MVP (Monthly)
- GPU Server: $96-144 (Vast.ai RTX 3090, 8hr/day)
- Backend Server: $24-30
- Database: $30
- Storage: $15-40
- **Total**: $165-244/month

### Production (24/7)
- GPU Server: $288 (24/7)
- Backend: $30
- Database: $50 (managed)
- Storage: $50
- CDN: $20
- **Total**: $438/month

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- GitHub Issues: [repository-url]
- Email: support@yourapp.com

## Contributors

Built with ❤️ by [Your Name]
