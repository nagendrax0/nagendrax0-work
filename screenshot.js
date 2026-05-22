const puppeteer = require('puppeteer');
const path = require('path');

const projects = [
  { url: 'https://nagendrax0.com', filename: 'nagendrax0' },
  // Add new projects here: { url: 'https://...', filename: 'project-name' }
];

(async () => {
  const target = process.argv[2];
  const list = target
    ? projects.filter(p => p.filename === target)
    : projects;

  if (!list.length) {
    console.error(`No project found: "${target}"`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  for (const { url, filename } of list) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const outPath = path.join(__dirname, 'images', `${filename}.png`);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`✓ ${url} → images/${filename}.png`);
    await page.close();
  }

  await browser.close();
})();
