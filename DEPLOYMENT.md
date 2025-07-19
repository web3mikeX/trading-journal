# 🚀 Vercel Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Preparation
- [x] Duplicate detection system implemented and tested
- [x] Toast notifications working locally
- [x] Database schema updated with duplicate detection fields
- [x] PostgreSQL configuration ready
- [x] Production build tested

### 🗄️ Database Setup (CRITICAL - Do This First!)

1. **Create PostgreSQL Database** (Vercel Postgres, Supabase, or similar)

2. **Run Migration Script**:
   ```sql
   -- Copy and run the contents of scripts/deploy-migration.sql
   -- This adds duplicate detection fields to existing Trade table
   ```

3. **Verify Schema**:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'Trade' 
   AND column_name IN ('tradeHash', 'isDuplicate', 'originalTradeId');
   ```

### 🔐 Environment Variables for Vercel

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-random-secret-key-here
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 🚀 Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment with duplicate detection"
   git push origin main
   ```

2. **Create Vercel Project**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables (above)

3. **First Deployment**:
   - Vercel will automatically build and deploy
   - Initial build may take 3-5 minutes

4. **Post-Deployment Verification**:
   - Test login with your credentials
   - Test CSV import with duplicates
   - Verify notifications appear
   - Check duplicate rejection works

### 🔧 Troubleshooting

**Common Issues**:

1. **Database Connection Error**:
   - Verify DATABASE_URL format
   - Ensure database allows connections from Vercel IPs
   - Check SSL requirements

2. **Migration Issues**:
   - Run migration script manually before deployment
   - Verify all fields exist in production database

3. **Build Errors**:
   - Check Vercel build logs
   - Ensure all dependencies are in package.json
   - Verify TypeScript errors are resolved

### 📱 Testing Duplicate Detection

After deployment:

1. **Login** with: `degenbitkid@gmail.com` / `demo123`
2. **Upload CSV** with duplicate trades
3. **Verify**:
   - ⚠️ Warning notification appears
   - 🔵 Duplicate review step works
   - ✅ Success notifications show
   - ❌ Exact duplicates are rejected

### 🎯 Success Criteria

- ✅ App loads successfully
- ✅ Authentication works
- ✅ Trades page displays
- ✅ CSV import shows notifications
- ✅ Duplicate detection prevents duplicates
- ✅ Force import works for selected duplicates

## 🆘 Support

If deployment fails:
1. Check Vercel build logs
2. Verify environment variables
3. Test database connection
4. Ensure migration was run

## 📊 Performance Notes

- Initial load may be slow (cold starts)
- Subsequent requests will be faster
- Database queries are optimized with indexes
- Toast notifications are lightweight and performant