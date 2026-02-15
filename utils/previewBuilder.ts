
export const buildFinalHtml = (projectFiles: Record<string, string>) => {
  const polyfill = `
    <script>
      // Enhanced Native Bridge Simulation
      window.NativeBridge = {
        getUsageStats: () => Promise.resolve({ screenTime: '4h 20m', topApp: 'Social Media' }),
        requestPermission: async (p) => {
           console.log('Requesting Permission for:', p);
           if (p === 'camera') {
             try { await navigator.mediaDevices.getUserMedia({ video: true }); return true; } catch(e) { return false; }
           }
           if (p === 'geolocation') {
             return new Promise((resolve) => navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false)));
           }
           return Promise.resolve(true);
        },
        showToast: (m) => { 
          alert('App Message: ' + m);
          console.log('Native Toast:', m); 
        },
        vibrate: (pattern = 200) => { 
          if (window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
          }
        },
        getLocation: () => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              (err) => reject(err)
            );
          });
        }
      };
      console.log('Mobile Preview Bridge Initialized');
    </script>
  `;

  const entryHtml = projectFiles['index.html'] || '<div id="app"></div>';
  
  const cssContent = Object.entries(projectFiles)
    .filter(([path]) => path.endsWith('.css'))
    .map(([path, content]) => `/* ${path} */\n${content}`)
    .join('\n');
    
  const jsContent = Object.entries(projectFiles)
    .filter(([path]) => path.endsWith('.js') || path === 'app.js')
    .map(([path, content]) => `// --- FILE: ${path} ---\ntry {\n${content}\n} catch(e) { console.error("Error in ${path}:", e); }\n`)
    .join('\n');
  
  const tailwindCdn = '<script src="https://cdn.tailwindcss.com"></script>';
  const lucideCdn = '<script src="https://unpkg.com/lucide@latest"></script>';
  
  const headInjection = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    ${tailwindCdn}
    ${lucideCdn}
    <style>
      /* Mobile App Reset & Safe Area Handling */
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      
      :root {
        --safe-top: env(safe-area-inset-top, 0px);
        --safe-bottom: env(safe-area-inset-bottom, 0px);
      }

      html, body {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        background-color: #000;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      body {
        overflow-x: hidden;
        overflow-y: auto;
      }

      ::-webkit-scrollbar { display: none; }

      ${cssContent}
    </style>
    ${polyfill}
  `;

  const bodyInjection = `
    <script>
      // Initialize Lucide icons if they exist in the generated HTML
      if (window.lucide) {
        window.lucide.createIcons();
      }
    </script>
    <script>\n${jsContent}\n</script>
  `;

  // If the AI didn't provide a full HTML document, wrap it
  if (!entryHtml.toLowerCase().includes('<html')) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        ${headInjection}
      </head>
      <body>
        <div id="app-root" class="min-h-screen">
          ${entryHtml}
        </div>
        ${bodyInjection}
      </body>
      </html>
    `;
  }

  // If it is a full document, inject our headers and scripts
  let finalHtml = entryHtml;
  if (finalHtml.includes('</head>')) {
    finalHtml = finalHtml.replace('</head>', `${headInjection}</head>`);
  } else {
    finalHtml = finalHtml.replace('<html', `<html><head>${headInjection}</head><html`);
  }

  if (finalHtml.includes('</body>')) {
    finalHtml = finalHtml.replace('</body>', `${bodyInjection}</body>`);
  } else {
    finalHtml = finalHtml + bodyInjection;
  }

  return finalHtml;
};
