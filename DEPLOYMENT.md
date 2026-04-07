# Production Deployment Guide

IronCore Coach is a full-stack monolithic application ready for deployment on modern platforms like **Render**, **Railway**, or any standard Virtual Private Server (VPS).

The frontend runs universally off the Express server, making deployments effortless as a single web service.

## 📁 Production Directory Structure

```text
workout/
├── server/
│   ├── server.js       # Main Express server and API endpoints
│   └── users.json      # Dynamic user database (auto-generated)
├── public/             # Served statically by Express
│   ├── index.html      # Mobile-responsive app interface
│   ├── css/styles.css  # Stylesheets
│   └── js/
│       ├── app.js      # App logic, Auth flow & API Client
│       ├── chart.js    # Metric visualization
│       └── notifications.js 
├── package.json        # Dependencies and build scripts
└── .gitignore          # Ignores logs, node_modules, .env, and local users.json
```

## 🔐 Environment Variables

The application relies on the following environment variables. In cloud platforms, configure these in your instance settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT`   | The port the web server will bind to. Render/Railway will inject this automatically. | `3000` |
| `JWT_SECRET` | A secure, random string used for cryptographic signing of user session tokens. | `'ironcore_coach_secret_key_2026'` |
| `NODE_ENV` | Mode the application runs in. | `'production'` |

## 🚀 Deployment Steps

### Option A: Deploying to Render.com (Recommended)

1. Upload this codebase to a GitHub repository.
2. Log into your Render dashboard and click **New > Web Service**.
3. Connect your GitHub account and select your repository.
4. Apply the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **CRITICAL: Persistent Disk Setup**
   Because IronCore Coach uses a local `users.json` file for operations, Render's _ephemeral_ file system will wipe users upon every deployment. You **must** attach a persistent disk.
   - Go to your service's **Disks** section.
   - Create a disk with Mount Path: `/opt/render/project/src/server`
   - Size: `1 GB` (Plenty for JSON).
6. Under **Environment variables**, set `JWT_SECRET` to a random, strong secret password.
7. Click **Deploy Web Service**.

### Option B: Deploying to Railway.app

1. Run `railway login` on your configured CLI, or log into the dashboard.
2. Click **New Project** > **Deploy from GitHub repo** and select your repository.
3. Railway automatically detects the `package.json` and runs `npm install` and `npm start`.
4. Go to the project **Variables** tab, and add `JWT_SECRET`.
5. **Data Persistence**:
   Similar to Render, you will need a volume so data doesn't wipe. Alternatively, for scalability, you can easily alter `server.js` to point to a Railway-provisioned PostgreSQL or Redis instance instead of `users.json`.

---

### Local Production Test

To test the production build locally before deploying:

```bash
# 1. Install packages
npm install

# 2. Start the server (runs via the start script)
npm start
```

Access the app on `http://localhost:3000`.
