# Deployment Guide for Deep Vortex AI Hub

## Quick Deploy to Vercel

### Step 1: Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import `deepvortexia/deepvortex-hub` repository
4. Select the `copilot/create-main-landing-page` branch

### Step 2: Configure Build Settings
```
Framework Preset: Create React App
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### Step 3: Environment Variables
No environment variables required for basic deployment.

### Step 4: Deploy
Click "Deploy" and wait for build to complete (~2-3 minutes).

### Step 5: Custom Domain
1. Go to Project Settings → Domains
2. Add custom domain: `deepvortexai.art`
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

## DNS Configuration

### Vercel DNS Records
Add these records to your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Subdomain Setup

Ensure these subdomains are configured:
- `emoticons.deepvortexai.art` → Emoticon Generator app
- `images.deepvortexai.art` → Image Generator app

## Post-Deployment Checklist

- [ ] Verify homepage loads at `deepvortexai.art`
- [ ] Test navigation to emoticons subdomain
- [ ] Test navigation to images subdomain  
- [ ] Verify mobile responsiveness
- [ ] Check SEO meta tags in source
- [ ] Test all tool cards (live and coming soon)
- [ ] Verify SSL certificate is active
- [ ] Test performance with Lighthouse

## Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90

## Build Information

- Bundle Size: 47.5 kB (gzipped)
- CSS Size: 1.87 kB (gzipped)
- Build Time: ~90 seconds
- Node Version: 18+

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Fonts Not Loading
Google Fonts may be blocked. They're imported via CSS, so ensure:
- CSP headers allow fonts.googleapis.com
- CORS is properly configured

### Navigation Not Working
External links use `window.open()`. Verify:
- Pop-up blockers are not interfering
- Target URLs are accessible

## Monitoring

Monitor these metrics after deployment:
- Page load times (Vercel Analytics)
- Error rates (Vercel Logs)
- Traffic patterns (Vercel Analytics)
- User engagement (external analytics)

## Support

For deployment issues:
1. Check Vercel build logs
2. Review browser console for errors
3. Contact Deep Vortex AI team

---

**Ready to deploy!** Follow these steps and your landing page will be live at deepvortexai.art 🚀
