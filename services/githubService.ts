
import { GithubConfig, ProjectConfig } from "../types";

export class GithubService {
  private getWorkflowYaml(appName: string) {
    // Sanitize app name for filename
    const safeAppName = appName.replace(/[^a-z0-9]/gi, '_');
    
    return `name: Build Production Android APK
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install Dependencies
        run: |
          npm init -y
          npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest @capacitor/assets@latest
          mkdir -p www
          mkdir -p assets

      - name: Initialize Android Project
        run: |
          npx cap add android
          npx cap copy android

      - name: Set App Display Name and Icon
        run: |
          # 1. Ensure Display Name in strings.xml is updated
          # This replaces the default 'OneClick App' label with the user's specific app name
          STRINGS_FILE="android/app/src/main/res/values/strings.xml"
          if [ -f "$STRINGS_FILE" ]; then
            sed -i 's/<string name="app_name">.*<\/string>/<string name="app_name">${appName}<\/string>/g' "$STRINGS_FILE"
            sed -i 's/<string name="title_activity_main">.*<\/string>/<string name="title_activity_main">${appName}<\/string>/g' "$STRINGS_FILE"
          fi

          # 2. Generate Native Assets (Icons)
          if [ -f "assets/icon-only.png" ]; then
            npx capacitor-assets generate --android
          fi

      - name: Build & Sign Release APK
        run: |
          cd android
          
          # 1. Create a Release Key (Automated Signing)
          keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias -storepass oneclick123 -keypass oneclick123 -dname "CN=OneClick, OU=Studio, O=AI, L=Global, S=Web, C=US"

          # 2. Inject Signing Config into Gradle
          echo "
          android {
              signingConfigs {
                  release {
                      storeFile file('release-key.jks')
                      storePassword 'oneclick123'
                      keyAlias 'my-key-alias'
                      keyPassword 'oneclick123'
                  }
              }
              buildTypes {
                  release {
                      signingConfig signingConfigs.release
                      minifyEnabled false
                  }
              }
          }" >> app/build.gradle

          # 3. Build the Release APK
          chmod +x gradlew
          ./gradlew assembleRelease
          
          # 4. Rename the default APK to the Project's Specific Name
          # This ensures the downloaded file is not called 'app-release.apk' or 'app-debug.apk'
          mv app/build/outputs/apk/release/app-release.apk app/build/outputs/apk/release/${safeAppName}.apk

      - name: Upload Production APK
        uses: actions/upload-artifact@v4
        with:
          name: ${safeAppName}-production
          path: android/app/build/outputs/apk/release/${safeAppName}.apk
          if-no-files-found: error`;
  }

  private toBase64(str: string): string {
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (e) {
      return btoa(unescape(encodeURIComponent(str)));
    }
  }

  async createRepo(token: string, repoName: string): Promise<string> {
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    const userRes = await fetch('https://api.github.com/user', { headers });
    if (!userRes.ok) throw new Error("গিটহাব অথেন্টিকেশন ফেইল করেছে।");
    const userData = await userRes.json();
    const username = userData.login;

    const checkRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });
    if (checkRes.ok) return username;

    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: repoName,
        private: false,
        auto_init: true
      })
    });

    if (!createRes.ok && createRes.status !== 422) {
        const errData = await createRes.json();
        throw new Error(`রেপো তৈরি করতে ব্যর্থ: ${errData.message}`);
    }

    return username;
  }

  async pushToGithub(config: GithubConfig, files: Record<string, string>, appConfig?: ProjectConfig) {
    const token = config.token.trim();
    const owner = config.owner.trim();
    const repo = config.repo.trim();
    const appName = appConfig?.appName || 'OneClickApp';

    if (!token || !owner || !repo) throw new Error("গিটহাব কনফিগারেশন অসম্পূর্ণ।");

    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers = {
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json'
    };

    // Sanitize Package Name
    let sanitizedAppId = (appConfig?.packageName || 'com.oneclick.studio')
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '');

    const capConfig = {
      appId: sanitizedAppId,
      appName: appName,
      webDir: 'www',
      bundledWebRuntime: false
    };

    const allFiles: Record<string, string> = { 
        ...files, 
        '.github/workflows/android.yml': this.getWorkflowYaml(appName),
        'capacitor.config.json': JSON.stringify(capConfig, null, 2)
    };

    // Handle Icon & Splash
    if (appConfig?.icon) {
      allFiles['assets/icon-only.png'] = appConfig.icon;
      allFiles['assets/icon.png'] = appConfig.icon;
    }
    if (appConfig?.splash) {
      allFiles['assets/splash.png'] = appConfig.splash;
      allFiles['assets/splash-dark.png'] = appConfig.splash;
    }

    for (const [path, content] of Object.entries(allFiles)) {
      const isBase64 = content.startsWith('data:image') || path.startsWith('assets/');
      const finalContent = isBase64 ? content.split(',')[1] || content : this.toBase64(content);

      const getRes = await fetch(`${baseUrl}/contents/${path}`, { headers });
      let sha: string | undefined;
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }

      await fetch(`${baseUrl}/contents/${path}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Sync: ${path}`,
          content: finalContent,
          sha: sha
        })
      });
    }
  }

  async getRunDetails(config: GithubConfig) {
    const headers = { 'Authorization': `token ${config.token}`, 'Accept': 'application/vnd.github.v3+json' };
    const runsRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/actions/runs?per_page=1`, { headers });
    if (!runsRes.ok) return null;
    const runsData = await runsRes.json();
    const latestRun = runsData.workflow_runs?.[0];
    if (!latestRun) return null;
    const jobsRes = await fetch(latestRun.jobs_url, { headers });
    const jobsData = await jobsRes.json();
    return { run: latestRun, jobs: jobsData.jobs || [] };
  }

  async getLatestApk(config: GithubConfig) {
    const headers = { 'Authorization': `token ${config.token}`, 'Accept': 'application/vnd.github.v3+json' };
    const runsRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/actions/runs?per_page=1`, { headers });
    if (!runsRes.ok) return null;
    const runsData = await runsRes.json();
    const latestRun = runsData.workflow_runs?.[0];
    if (!latestRun || latestRun.status !== 'completed' || latestRun.conclusion !== 'success') return null;
    
    const artifactsRes = await fetch(latestRun.artifacts_url, { headers });
    const data = await artifactsRes.json();
    const artifact = data.artifacts?.find((a: any) => a.name.includes('-production'));
    
    return artifact ? { downloadUrl: artifact.archive_download_url, webUrl: latestRun.html_url } : null;
  }

  async downloadArtifact(config: GithubConfig, url: string) {
    const res = await fetch(url, { headers: { 'Authorization': `token ${config.token}` } });
    if (!res.ok) throw new Error("ডাউনলোড ফেইল করেছে।");
    return await res.blob();
  }
}
