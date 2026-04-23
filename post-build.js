/**
 * Post-build script: Converts Vite SPA output to static-hosting compatible
 * Run after `npm run build`: node post-build.js
 */

import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = 'out';
const JS_DIR = path.join(OUT_DIR, 'js');
const CSS_DIR = path.join(OUT_DIR, 'css');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');

function findFiles(dir, ext) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  console.log('🔧 Convirtiendo build a formato estático para Hostinger...\n');

  // 1. Ensure directory structure exists
  if (!fs.existsSync(JS_DIR)) fs.mkdirSync(JS_DIR, { recursive: true });
  if (!fs.existsSync(CSS_DIR)) fs.mkdirSync(CSS_DIR, { recursive: true });
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

  // 2. Find and move JS files from out/ to out/js/
  const jsFiles = findFiles(OUT_DIR, '.js').filter(f => !f.includes('/js/'));
  for (const file of jsFiles) {
    const dest = path.join(JS_DIR, path.basename(file));
    fs.renameSync(file, dest);
    console.log(`  📦 JS movido: ${path.relative(OUT_DIR, file)} → js/${path.basename(file)}`);
  }

  // 3. Find and move CSS files from out/ to out/css/
  const cssFiles = findFiles(OUT_DIR, '.css').filter(f => !f.includes('/css/'));
  for (const file of cssFiles) {
    const dest = path.join(CSS_DIR, path.basename(file));
    fs.renameSync(file, dest);
    console.log(`  🎨 CSS movido: ${path.relative(OUT_DIR, file)} → css/${path.basename(file)}`);
  }

  // 4. Move other assets (images, fonts, etc.) to out/assets/
  const assetExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  const allFiles = findFiles(OUT_DIR, '');
  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    const relPath = path.relative(OUT_DIR, file);
    // Skip files already in organized dirs, index.html, and vite.svg
    if (relPath.startsWith('js/') || relPath.startsWith('css/') || relPath.startsWith('assets/')) continue;
    if (relPath === 'index.html') continue;
    if (assetExts.includes(ext)) {
      const dest = path.join(ASSETS_DIR, path.basename(file));
      fs.renameSync(file, dest);
      console.log(`  🖼️  Asset movido: ${relPath} → assets/${path.basename(file)}`);
    }
  }

  // 5. Read index.html
  const indexPath = path.join(OUT_DIR, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');

  // 6. Fix asset paths in index.html to be relative
  // Replace absolute paths with relative ones
  html = html.replace(/href="\/assets\//g, 'href="./assets/');
  html = html.replace(/href="\/css\//g, 'href="./css/');
  html = html.replace(/src="\/js\//g, 'src="./js/');
  html = html.replace(/src="\/assets\//g, 'src="./assets/');

  // Also handle paths without leading slash
  html = html.replace(/href="assets\//g, 'href="./assets/');
  html = html.replace(/href="css\//g, 'href="./css/');
  html = html.replace(/src="js\//g, 'src="./js/');
  html = html.replace(/src="assets\//g, 'src="./assets/');

  // Fix vite.svg path
  html = html.replace(/href="\/vite\.svg"/g, 'href="./assets/vite.svg"');
  html = html.replace(/href="vite\.svg"/g, 'href="./assets/vite.svg"');

  fs.writeFileSync(indexPath, html);
  console.log('  📝 index.html: rutas convertidas a relativas\n');

  // 7. Find the main JS bundle and transform it for HashRouter
  const jsBundleFiles = findFiles(JS_DIR, '.js');
  let transformedCount = 0;

  for (const jsFile of jsBundleFiles) {
    let content = fs.readFileSync(jsFile, 'utf-8');
    let modified = false;

    // Replace BrowserRouter with HashRouter
    if (content.includes('BrowserRouter')) {
      content = content.replace(/BrowserRouter/g, 'HashRouter');
      modified = true;
    }

    // Remove basename prop from HashRouter (HashRouter doesn't use basename)
    if (content.includes('basename')) {
      // Remove basename={__BASE_PATH__} or basename={something}
      content = content.replace(/basename\s*=\s*\{[^}]+\}/g, '');
      modified = true;
    }

    // Fix __BASE_PATH__ references for static hosting
    if (content.includes('__BASE_PATH__')) {
      content = content.replace(/__BASE_PATH__/g, '"/"');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(jsFile, content);
      console.log(`  🔀 JS transformado: ${path.relative(OUT_DIR, jsFile)}`);
      transformedCount++;
    }
  }

  // 8. Clean up empty directories
  const dirsToClean = [path.join(OUT_DIR, 'src')];
  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`  🗑️  Directorio limpiado: ${path.relative(OUT_DIR, dir)}`);
      } catch {
        // ignore
      }
    }
  }

  console.log(`\n✅ Build estático listo en ./${OUT_DIR}/`);
  console.log(`\n📁 Estructura final:`);
  console.log(`   index.html`);
  console.log(`   js/        (bundles JavaScript)`);
  console.log(`   css/       (estilos)`);
  console.log(`   assets/    (imágenes, fuentes, etc.)`);
  console.log(`\n🚀 Sube TODO el contenido de la carpeta "${OUT_DIR}/" a tu hosting.`);
  console.log(`   Si usas un subdominio: /public_html/farmacia/`);
  console.log(`   La app usará HashRouter (#/ruta) para SPA routing sin servidor.`);
}

main();