
export const buildFinalHtml = (projectFiles: Record<string, string>) => {
  const polyfill = `
    <script>
      window.NativeBridge = {
        getUsageStats: () => Promise.resolve({ screenTime: '4h 20m', topApp: 'Social Media' }),
        requestPermission: (p) => Promise.resolve(true),
        showToast: (m) => { console.log('Native Toast:', m); },
        vibrate: () => { window.navigator.vibrate ? window.navigator.vibrate(200) : console.log('Vibrating...'); },
      };
      console.log('Mobile Preview Bridge Initialized');
    </script>
  `;

  let entryHtml = projectFiles['index.html'] || '<body><div id="app"></div></body>';
  
  let processedHtml = entryHtml
    .replace(/<link[^>]+href=["'](?!\w+:\/\/)[^"']+["'][^>]*>/gi, '')
    .replace(/<script[^>]+src=["'](?!\w+:\/\/)[^"']+["'][^>]*><\/script>/gi, '');

  const cssContent = Object.entries(projectFiles)
    .filter(([path]) => path.endsWith('.css'))
    .map(([path, content]) => `/* ${path} */\n${content}`)
    .join('\n');
    
  const jsContent = Object.entries(projectFiles)
    .filter(([path]) => path.endsWith('.js'))
    .map(([path, content]) => `// --- FILE: ${path} ---\ntry {\n${content}\n} catch(e) { console.error("Error in ${path}:", e); }\n`)
    .join('\n');
  
  const tailwindCdn = '<script src="https://cdn.tailwindcss.com"></script>';
  const headInjection = `
    ${tailwindCdn}
    <style>
      ${cssContent}
      ::-webkit-scrollbar { display: none; }
      body { -ms-overflow-style: none; scrollbar-width: none; overflow-x: hidden; }
    </style>
    ${polyfill}
  `;

  if (processedHtml.includes('</head>')) {
    processedHtml = processedHtml.replace('</head>', `${headInjection}</head>`);
  } else {
    processedHtml = headInjection + processedHtml;
  }

  const finalScript = `<script>\n${jsContent}\n</script>`;
  if (processedHtml.includes('</body>')) {
    processedHtml = processedHtml.replace('</body>', `${finalScript}</body>`);
  } else {
    processedHtml = processedHtml + finalScript;
  }

  return processedHtml;
};
