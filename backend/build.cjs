const { build } = require('esbuild');
const { glob } = require('glob');

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
  
  console.log('✅ Build completed successfully');
}

buildApp().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
