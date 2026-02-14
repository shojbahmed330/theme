
import { GithubConfig, ProjectConfig } from "../types";

export class GithubService {
  private workflowYaml = `name: Build Android APK
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
          check-latest: true

      - name: Initialize Capacitor and Build APK
        run: |
          # 1. Setup directories
          rm -rf www android
          mkdir -p www
          mkdir -p assets
          
          # 2. Ensure capacitor.config.json exists
          if [ ! -f capacitor.config.json ]; then
            echo '{"appId": "com.oneclick.studio", "appName": "OneClickApp", "webDir": "www", "bundledWebRuntime": false}' > capacitor.config.json
          fi
          
          # 3. Sync web assets
          find . -maxdepth 3 -type f \\
            -not -path '*/.*' \\
            -not -name "package*" \\
            -not -name "tsconfig*" \\
            -not -name "vite.config.ts" \\
            -not -name "capacitor.config.json" \\
            -not -path "./android/*" \\
            -not -path "./node_modules/*" \\
            -exec cp --parents "{}" www/ ';'
          
          # 4. Setup Project
          if [ ! -f package.json ]; then
            npm init -y
          fi
          
          # 5. Install Dependencies
          npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest @capacitor/assets@latest
          
          # 6. Asset Generation
          if [ -d "assets" ] && [ "$(ls -A assets)" ]; then
            npx capacitor-assets generate --android || true
          fi
          
          # 7. Add Android Platform
          npx cap add android
          
          # 8. Gradle Fixes - Explicit Echo (NO CAT/EOF)
          echo "android.enableJetifier=true" >> android/gradle.properties
          echo "android.useAndroidX=true" >> android/gradle.properties
          
          sed -i 's/JavaVersion.VERSION_17/JavaVersion.VERSION_21/g' android/app/build.gradle
          sed -i 's/JavaVersion.VERSION_11/JavaVersion.VERSION_21/g' android/app/build.gradle
          sed -i 's/JavaVersion.VERSION_1_8/JavaVersion.VERSION_21/g' android/app/build.gradle
          
          echo "android {" >> android/app/build.gradle
          echo "    packagingOptions {" >> android/app/build.gradle
          echo "        resources {" >> android/app/build.gradle
          echo "            pickFirst 'META-INF/kotlin-stdlib.kotlin_module'" >> android/app/build.gradle
          echo "            pickFirst 'META-INF/kotlin-stdlib-jdk8.kotlin_module'" >> android/app/build.gradle
          echo "            pickFirst 'META-INF/kotlin-stdlib-jdk7.kotlin_module'" >> android/app/build.gradle
          echo "        }" >> android/app/build.gradle
          echo "    }" >> android/app/build.gradle
          echo "}" >> android/app/build.gradle
          
          echo "configurations.all {" >> android/app/build.gradle
          echo "    resolutionStrategy {" >> android/app/build.gradle
          echo "        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.10'" >> android/app/build.gradle
          echo "        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.10'" >> android/app/build.gradle
          echo "        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.10'" >> android/app/build.gradle
          echo "        force 'com.android.support:support-v4:28.0.0'" >> android/app/build.gradle
          echo "    }" >> android/app/build.gradle
          echo "}" >> android/app/build.gradle

          npx cap copy android
          
          # 9. Build APK
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error`;

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
    if (!userRes.ok) throw new Error("GitHub Authentication failed.");
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
        description: 'Auto-generated repository for Android build via OneClick Studio',
        auto_init: true
      })
    });

    if (!createRes.ok) {
        const errData = await createRes.json();
        if (createRes.status === 422) return username;
        throw new Error(`Failed to create repository: ${errData.message}`);
    }

    return username;
  }

  async pushToGithub(config: GithubConfig, files: Record<string, string>, appConfig?: ProjectConfig) {
    const token = config.token.trim();
    const owner = config.owner.trim();
    const repo = config.repo.trim();

    if (!token || !owner || !repo) throw new Error("গিটহাব কনফিগারেশন ইনভ্যালিড।");

    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers = {
      'Authorization': `token ${token}`, 
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    // --- ULTRA-STRICT APP ID SANITIZATION ---
    let rawId = (appConfig?.packageName || 'com.oneclick.studio').toString();
    let sanitizedAppId = rawId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '') // Remove ANY character that isn't a-z, 0-9 or dot
      .replace(/\.+/g, '.')       // Replace multiple dots with one
      .replace(/^\.|\.$/g, '');   // Trim dots from both ends

    // Ensure it has at least 2 segments
    if (!sanitizedAppId.includes('.') || sanitizedAppId.split('.').length < 2) {
      sanitizedAppId = `com.oneclick.${sanitizedAppId.replace('.', '')}`;
    }

    const capConfig = {
      appId: sanitizedAppId,
      appName: (appConfig?.appName || 'OneClickApp').toString().trim(),
      webDir: 'www',
      bundledWebRuntime: false
    };

    const allFiles: Record<string, string> = { 
        ...files, 
        '.github/workflows/android.yml': this.workflowYaml,
        'capacitor.config.json': JSON.stringify(capConfig, null, 2)
    };

    if (appConfig?.icon) {
      allFiles['assets/icon-only.png'] = appConfig.icon;
      allFiles['assets/icon-foreground.png'] = appConfig.icon;
      allFiles['assets/icon-background.png'] = '#FFFFFF'; 
    }
    if (appConfig?.splash) {
      allFiles['assets/splash.png'] = appConfig.splash;
    }

    for (const [path, content] of Object.entries(allFiles)) {
      const isBase64 = content.startsWith('data:image') || path.startsWith('assets/');
      const finalContent = isBase64 ? content.split(',')[1] || content : this.toBase64(content);

      // 1. Get current SHA
      const getRes = await fetch(`${baseUrl}/contents/${path}`, { headers });
      let sha: string | undefined;
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }

      // 2. Put content (Strict Error Handling)
      const putRes = await fetch(`${baseUrl}/contents/${path}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Update ${path} via OneClick Studio Build Engine`,
          content: finalContent,
          sha: sha
        })
      });

      if (!putRes.ok) {
          const errorData = await putRes.json();
          // 409 Conflict is common if SHA is mismatched, try one more time if it's a critical file
          throw new Error(`Failed to update ${path}: ${errorData.message}`);
      }
    }
  }

  async listRepos(token: string) {
    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    return res.ok ? await res.json() : [];
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
    const artifact = data.artifacts?.find((a: any) => a.name === 'app-debug');
    return artifact ? { downloadUrl: artifact.archive_download_url, webUrl: latestRun.html_url } : null;
  }

  async downloadArtifact(config: GithubConfig, url: string) {
    const res = await fetch(url, { headers: { 'Authorization': `token ${config.token}` } });
    if (!res.ok) throw new Error("ডাউনলোড এরর।");
    return await res.blob();
  }
}
