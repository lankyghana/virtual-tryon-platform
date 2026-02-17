#!/usr/bin/env python3
"""
Database initialization script
Creates all tables and initial data
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, init_db
from sqlalchemy import text
from app.models import User, Job, Result, Quota


def main():
    """Initialize database"""
    print("🗄️  Initializing database...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)

        # Ensure auth columns/constraints exist for local login
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"))
            conn.execute(text("ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;"))
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
                    ) THEN
                        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
                    END IF;
                END$$;
            """))
        
        print("✅ Database tables created successfully!")
        print("\nCreated tables:")
        print("  - users")
        print("  - jobs")
        print("  - results")
        print("  - quotas")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
