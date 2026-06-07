const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'data', 'screenshots');

// Ensure directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshotAndScanDOM(url) {
  let browser = null;
  const filename = `${crypto.randomBytes(16).toString('hex')}.png`;
  const relativePath = `screenshots/${filename}`;
  const savePath = path.join(SCREENSHOT_DIR, filename);

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set user agent to avoid bot-blocking redirects
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    // Navigate with a fast timeout (8s max) to keep response snappy
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });

    // 1. Capture screenshot
    await page.screenshot({ path: savePath });

    // 2. Scan DOM for input threat indicators (e.g. login boxes)
    const domAudit = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const hasPasswordInput = inputs.some(i => i.type === 'password');
      const hasCardInput = inputs.some(i => {
        const name = (i.name || '').toLowerCase();
        const placeholder = (i.placeholder || '').toLowerCase();
        return name.includes('card') || placeholder.includes('card') || name.includes('cc') || name.includes('cvv');
      });

      const forms = Array.from(document.querySelectorAll('form'));
      const hasSubmitForm = forms.length > 0;

      const keywords = ['login', 'verify', 'bank', 'secure', 'signin', 'paypal', 'account'];
      const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
      const matchedKeywords = keywords.filter(kw => bodyText.includes(kw));

      return {
        hasPasswordInput,
        hasCardInput,
        hasSubmitForm,
        matchedKeywords,
        inputCount: inputs.length
      };
    });

    await browser.close();

    return {
      success: true,
      screenshotUrl: `/screenshots/${filename}`,
      domAudit
    };

  } catch (error) {
    console.error('Puppeteer Service Error:', error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (err) {}
    }
    
    // Return empty results on failure
    return {
      success: false,
      screenshotUrl: null,
      error: error.message,
      domAudit: {
        hasPasswordInput: false,
        hasCardInput: false,
        hasSubmitForm: false,
        matchedKeywords: [],
        inputCount: 0
      }
    };
  }
}

module.exports = { captureScreenshotAndScanDOM };
