# Instructions for Manas - Frontend Development Setup

## Problem
GitHub web interface shows "Uploads are disabled" because the repository requires Git commands for file uploads.

## Solution - Use Git Commands (Not Web Upload)

### Step 1: Clone the Repository
```bash
git clone https://github.com/sunithabalagolla/MRR-website.git
cd MRR-website
```

### Step 2: Switch to Frontend Branch
```bash
git checkout frontend-dev
```

### Step 3: Verify You're on the Right Branch
```bash
git branch
# Should show: * frontend-dev
```

### Step 4: Check Current Files
```bash
ls
# You should see: client/ admin/ server/
```

### Step 5: Make Your Changes
- Work in the `client/` folder for frontend files
- Add new pages, modify existing HTML/CSS/JS files
- The existing website files are already in `client/` folder

### Step 6: Add and Commit Your Changes
```bash
# Add all your changes
git add .

# Commit with a descriptive message
git commit -m "Add new frontend features - describe what you added"
```

### Step 7: Push Your Changes
```bash
git push origin frontend-dev
```

## Important Notes:
1. **NEVER use GitHub web interface to upload files** - it's disabled
2. **Always work in the `frontend-dev` branch** - not main
3. **Your files go in the `client/` folder**
4. **Use Git commands only** for uploading changes

## If You Get Errors:
1. Make sure you have Git installed
2. Make sure you're authenticated with GitHub
3. Contact Sunitha if you need repository access permissions

## Current Folder Structure:
```
MRR-website/
├── client/          ← Your frontend files are here
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── images/
├── admin/           ← Admin panel (also frontend)
└── server/          ← Backend (Sunitha's work)
```

## Quick Commands Reference:
```bash
# Check which branch you're on
git branch

# Switch to frontend branch
git checkout frontend-dev

# See what files changed
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push origin frontend-dev
```