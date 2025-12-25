const { build } = require('esbuild');
const { glob } = require('glob');
const fs = require('fs');
const path = require('path');

function replaceImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      replaceImports(filePath);
    } else if (file.isFile() && filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      // Replace .ts extensions with .js in imports
      content = content.replace(/from\s+['"](\.\.[\/\\]|\.[\/\\])([^'"]+)\.ts['"]/g, 'from "$1$2.js"');
      content = content.replace(/import\s+['"](\.\.[\/\\]|\.[\/\\])([^'"]+)\.ts['"]/g, 'import "$1$2.js"');
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

async function buildApp() {
  const entryPoints = await glob('src/**/*.ts');
  const scriptPoints = await glob('scripts/**/*.ts');
  
  await build({
    entryPoints: [...entryPoints, ...scriptPoints],
    outdir: 'dist',
    format: 'esm',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    bundle: false,
    outExtension: { '.js': '.js' },
    loader: { '.ts': 'ts' },
    logLevel: 'info'
  });
  
  console.log('✅ Build completed, fixing import paths...');
  replaceImports('./dist');
  console.log('✅ Import paths fixed');
}

buildApp().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
