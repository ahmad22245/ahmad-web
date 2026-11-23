# Ahmad Web & Automation

Clean light pastel digital studio website for **Ahmad Web & Automation**, an independent studio founded by Muhammad Ahmad in Bahria Town, Lahore. Specializing in high-converting web experiences, WhatsApp AI chatbots, and autonomous n8n workflows.

---

## 🚀 Local Development

1. **Clone & Setup**:
   ```bash
   git clone <repo-url>
   cd ahmad-web-automation
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` and insert your Google Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Local Server**:
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Render (Node Web Service)

1. Push your repository to GitHub / GitLab (ensure `.env` is NOT committed; `.gitignore` is preconfigured).
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** &rarr; **Web Service**.
3. Connect your repository.
4. Set the following service configuration:
   - **Name**: `ahmad-web-automation`
   - **Environment**: `Node`
   - **Region**: Closest to your users (e.g. Frankfurt, Singapore, Oregon)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `your_actual_gemini_api_key`
6. Under **Advanced Settings**:
   - **Health Check Path**: `/healthz`
7. Click **Deploy Web Service**. Render will build and deploy your site with automatic HTTPS and zero configuration.
