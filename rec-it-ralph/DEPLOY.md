# Netlify Deployment Guide

## 🚀 Quick Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Netlify deployment config"
git push origin main
```

### 2. Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize
4. Select your `rec-it-ralph` repository
5. **Settings will auto-detect from `netlify.toml`:**
   - Build command: (none needed)
   - Publish directory: `.` (root)
   - Branch: `main`
6. Click "Deploy site"

### 3. Environment Variables (Important!)
Your Firebase config is currently hardcoded. For security, add these as environment variables:

**In Netlify Dashboard:**
1. Go to Site settings → Environment variables
2. Add these variables:
```
FIREBASE_API_KEY=AIzaSyATWPODhqbeIpGrpbwYeTJG-m2LFAD0yEY
FIREBASE_AUTH_DOMAIN=rec-it-ralph-f086b.firebaseapp.com
FIREBASE_DATABASE_URL=https://rec-it-ralph-f086b-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=rec-it-ralph-f086b
FIREBASE_STORAGE_BUCKET=rec-it-ralph-f086b.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=59142094523
FIREBASE_APP_ID=1:59142094523:web:fd8d6c899125f62b23739e
FIREBASE_MEASUREMENT_ID=G-F8VYDHN758
TMDB_API_KEY=a0b8875c7b4b0ae623e5b39c0a83b8ea
```

### 4. Update Code to Use Environment Variables
Replace hardcoded values in your JavaScript:

```javascript
// In index.html, replace the firebaseConfig object:
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyATWPODhqbeIpGrpbwYeTJG-m2LFAD0yEY",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "rec-it-ralph-f086b.firebaseapp.com",
    // ... rest of config
};
```

## 🔄 Continuous Deployment

Once connected, **every push to main branch automatically deploys!**

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
# ✨ Site updates automatically
```

## 🌐 Domain Setup

### Custom Domain (Optional)
1. Buy domain from any registrar
2. In Netlify: Site settings → Domain management → Add custom domain
3. Update DNS records as shown in Netlify
4. SSL certificate auto-provisions

### Free Netlify Domain
Your site will be at: `https://[random-name].netlify.app`
You can change the name in Site settings → General → Site details

## 🔧 Configuration Files Created

- **`netlify.toml`** - Main configuration, security headers, redirects
- **`_redirects`** - SPA routing fallback to index.html  
- **`package.json`** - Project metadata and scripts

## 📊 Build Status & Analytics

- **Deploy logs**: Netlify dashboard → Deploys
- **Analytics**: Enable in Site settings → Analytics
- **Form handling**: Works automatically for any HTML forms
- **Function**: Can add serverless functions in `netlify/functions/`

## 🚨 Environment Security

**Current State**: Firebase config is exposed in HTML (normal for frontend)
**Recommended**: 
- Set up Firebase Security Rules to restrict access
- Consider using Firebase Auth for user authentication
- API keys for TMDB are client-safe but consider rate limiting

## 🛠️ Troubleshooting

**404 on refresh?** 
- Check `_redirects` file exists
- Ensure `netlify.toml` has redirect rule

**Build fails?**
- Check Deploy logs in Netlify dashboard
- Ensure all files are committed to Git

**Environment variables not working?**
- Restart deployment after adding variables
- Check variable names match exactly