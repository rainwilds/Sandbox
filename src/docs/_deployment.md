# Build & Deployment Manual

This manual outlines the professional "Measure and Manage" pipeline for the Rainwilds Sandbox. By following this workflow, you ensure that your technical SEO, Web Components, and AI Handshake assets are optimized for the **March 2026 Core Update** before deployment.

---

## **1. Repository Setup (Visual Studio Code)**
Use VS Code's integrated Git tools to maintain a local "Source of Truth" that matches the online repository.

1.  **Open Visual Studio Code.**
2.  Open the Command Palette (**`Ctrl + Shift + P`**).
3.  Type **`Git: Clone`** and press Enter.
4.  Paste the repository URL: `https://github.com/rainwilds/Sandbox.git`.
5.  Select your local workspace folder and click **Open** when prompted.

---

## **2. Pull-Only Workflow (Updating Gemini Context)**
Keep your local environment fresh without accidentally pushing development noise or experimental builds to the main repository.

1.  Open the **Source Control** tab (left sidebar).
2.  **Safety Step:** Click **Discard All Changes** (curly arrow) to clear local build file noise.
3.  Click the **three dots (...)** at the top of the pane.
4.  Select **Pull** to sync with the latest online updates.

---

## **3. Environment Initialization**
Prepare your machine to handle Static Site Generation (SSG) and headless browser rendering.

1.  **Open VS Code Terminal:** (**`Ctrl + ~`**).
2.  **Node.js Setup:** Run the following to create the project brain and install the rendering engine:
    ```bash
    npm init -y
    npm install puppeteer
    ```
3.  **Linux Dependencies (Fresh Environments):** If running on a new Linux partition or WSL, install the required graphics libraries for Puppeteer:
    ```bash
    sudo apt-get update && sudo apt-get install -y libnss3 libatk-bridge2.0-0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcups2
    ```
3.  **Windows 11 (Fresh Environments)**
    ```bash
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```
    

---

## **4. Local Server & Build (The Transformation)**
The build process transforms dynamic Web Components into "Wave 1" crawlable static HTML. You must manage two distinct ports during this phase.

### **The Two Ports: Why 5500 vs. 8080?**

| Port | Name | Purpose | What you see |
| :--- | :--- | :--- | :--- |
| **5500** | **The Workshop** | **Development State.** Where Puppeteer "looks" to see your dynamic Web Components in action. | Raw code, dynamic `<custom-block>` tags, and modular JavaScript. |
| **8080** | **The Final Film** | **Production State.** Where you verify the static files in `/dist` before they go to SiteGround. | "Flattened" HTML, absolute paths, and finalized synced assets. |

### **The Build Execution**
1.  **Terminal Tab 1:** Start the source server:
    ```bash
    npx http-server -p 5500
    ```
    *(Leave this running while you build.)*
2.  **Terminal Tab 2:** Execute the build engine:
    ```bash
    node build.js
    ```
    *(This populates the `/dist` folder with SEO-optimized files.)*
3.  **Terminal Tab 1 (Stop & Switch):** Press `Ctrl + C` to stop the 5500 server, then preview the result:
    ```bash
    npx http-server ./dist -p 8080
    ```
4.  **Verification:** Visit **`http://localhost:8080`** in your browser to confirm the slider works and images load.

---

## **5. Production Deployment (SiteGround)**
The contents of your local **`/dist`** folder represent your revenue-ready product. 

1.  **Connect to SiteGround:** Use the SiteGround File Manager or an FTP client (e.g., FileZilla).
2.  **Navigate to Root:** Open the `public_html` directory of your target domain.
3.  **Sync Files:** Upload all **contents** of the local `/dist` folder into `public_html`. (Do not upload the folder itself, just its contents).
4.  **2026 Audit:** * Visit `yourdomain.com/sitemap.xml` to ensure all pages are listed at the root level.
    * Visit `yourdomain.com/llms.txt` to verify the **AI Handshake** and referral codes are active.

---

> **Pro-Tip:** Always view your site on **Port 8080** before deploying. If it works there, it will work on SiteGround. Opening files via Windows Explorer (`file:///`) will cause 404s and CORS errors because it cannot simulate the server environment.