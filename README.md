# Ahmad Web & Automation

Clean light pastel digital studio website for **Ahmad Web & Automation**, an independent studio founded by Muhammad Ahmad in Bahria Town, Lahore. Specializing in high-converting web experiences, autonomous WhatsApp AI chatbots, and custom n8n workflows.

---

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd ahmad-web-automation
   ```

2. **Setup Environment**:
   Copy `.env.example` to `.env` and add your Google Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Add your key inside `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Local Server**:
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
   - The local server serves static files strictly from `public/` and handles `/api/chat`.

---

## 🚀 Deploying on Netlify (Free Plan, No Card Required)

This repository includes a preconfigured `netlify.toml` and modern serverless Netlify Function (`netlify/functions/chat.js`) mapped to `/api/chat`.

1. Push your repository to GitHub or GitLab.
2. Sign up or log in to [Netlify](https://app.netlify.com/).
3. Click **Add new site** &rarr; **Import an existing project** &rarr; Select your Git repository.
4. Verify the site build settings (automatically detected from `netlify.toml`):
   - **Build command**: *(leave empty)*
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
5. Go to **Environment variables** and add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `your_actual_gemini_api_key`
6. Click **Deploy ahmad-web-automation**. Netlify will deploy your site with global CDN hosting, automated HTTPS, and serverless AI chat.

---

## 🌐 Alternative: Deploying on Render (Node Web Service)

1. Connect your repository in [Render Dashboard](https://dashboard.render.com/).
2. Select **Web Service** with runtime **Node**.
3. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variable**: `GEMINI_API_KEY` = `your_key`
   - **Health Check Path**: `/healthz`
