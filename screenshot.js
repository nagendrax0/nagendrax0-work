const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const projects = JSON.parse(fs.readFileSync(path.join(__dirname, 'projects.json'), 'utf8'));
const target = process.argv[2];
const list = target ? projects.filter(p => p.image?.includes(target)) : projects;

if (!list.length) {
  console.error(`No project found matching "${target}"`);
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  for (const p of list) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 });
    const slug = p.name.replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/-+/g, '-');
    const outPath = path.join(__dirname, 'images', `${slug}.png`);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    console.log(`✓ ${p.url} → images/${slug}.png`);
    await page.close();
  }

  await browser.close();
})();
