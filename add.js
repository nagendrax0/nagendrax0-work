const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

const PROJECTS_FILE = path.join(__dirname, 'projects.json');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function takeScreenshot(url, filename) {
  console.log(`  Taking screenshot of ${url}...`);
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  const outPath = path.join(__dirname, 'images', `${filename}.png`);
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await browser.close();
  console.log(`  ✓ Screenshot saved → images/${filename}.png`);
  return `./images/${filename}.png`;
}

(async () => {
  console.log('\nAdd a project to the directory\n');

  const name        = await ask('Name (e.g. nagendrax0.com): ');
  const url         = await ask('URL (https://...): ');
  const description = await ask('Description (one line): ');
  const type        = await ask('Type — website / web-app / app / fun: ');
  const status      = await ask('Status — live / wip / archived: ');
  const version     = await ask('Version (e.g. 1.0, leave blank to skip): ');

  rl.close();

  const slug = name.replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/-+/g, '-');
  const imageFile = await takeScreenshot(url, slug);

  const projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));

  // Update if slug already exists, otherwise add new
  const existing = projects.findIndex(p => p.name === name);
  const entry = {
    name,
    url,
    description,
    type: type.trim(),
    status: status.trim(),
    ...(version.trim() ? { version: version.trim() } : {}),
    image: imageFile,
    updatedAt: new Date().toISOString().split('T')[0],
  };

  if (existing >= 0) {
    projects[existing] = entry;
    console.log(`\n  Updated existing entry: ${name}`);
  } else {
    projects.unshift(entry);
    console.log(`\n  Added: ${name}`);
  }

  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2) + '\n');

  console.log('  Committing and pushing...');
  execSync(`git add projects.json images/${slug}.png`, { cwd: __dirname });
  execSync(`git commit -m "Add/update ${name} in directory"`, { cwd: __dirname });
  execSync('git push', { cwd: __dirname });
  console.log('  ✓ Live on work.nagendrax0.com\n');
})();
