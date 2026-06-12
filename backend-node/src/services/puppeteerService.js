const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'data', 'screenshots');

// Ensure directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let browserInstance = null;

async function getBrowser() {
  if (browserInstance) {
    try {
      // Check if browser is still responsive
      await browserInstance.version();
      return browserInstance;
    } catch (e) {
      console.warn("Cached browser instance is non-responsive. Relaunching...");
      try {
        await browserInstance.close();
      } catch (err) {}
      browserInstance = null;
    }
  }

  browserInstance = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security'
    ]
  });

  return browserInstance;
}

// Clean exit hook
process.on('exit', async () => {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (err) {}
  }
});

async function captureScreenshotAndScanDOM(url) {
  let page = null;
  const filename = `${crypto.randomBytes(16).toString('hex')}.png`;
  const savePath = path.join(SCREENSHOT_DIR, filename);

  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set user agent to avoid bot-blocking redirects
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    // 1. Navigate with a fast timeout (2.5s max) to keep response snappy
    let pageLoaded = true;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 2500 });
    } catch (gotoErr) {
      console.warn(`Puppeteer page.goto warning for ${url}:`, gotoErr.message);
      pageLoaded = false;
    }

    if (!pageLoaded) {
      // Short-circuit: if page failed to load or timed out, do not waste time screenshotting/auditing
      await page.close();
      return {
        success: false,
        screenshotUrl: null,
        domAudit: {
          hasPasswordInput: false,
          hasCardInput: false,
          hasSubmitForm: false,
          matchedKeywords: [],
          inputCount: 0
        }
      };
    }

    // 2. Run screenshot and DOM evaluation concurrently to minimize latency
    let screenshotUrl = null;
    let domAudit = {
      hasPasswordInput: false,
      hasCardInput: false,
      hasSubmitForm: false,
      matchedKeywords: [],
      inputCount: 0
    };

    const runScreenshot = async () => {
      try {
        const screenshotPromise = page.screenshot({ path: savePath });
        const screenshotTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Screenshot capture timed out')), 2000);
        });
        await Promise.race([screenshotPromise, screenshotTimeout]);
        screenshotUrl = `/screenshots/${filename}`;
      } catch (screenshotErr) {
        console.warn(`Puppeteer page.screenshot warning for ${url}:`, screenshotErr.message);
      }
    };

    const runDomAudit = async () => {
      try {
        const auditPromise = page.evaluate(() => {
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

        const auditTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('DOM audit timed out')), 1000);
        });

        domAudit = await Promise.race([auditPromise, auditTimeout]);
      } catch (auditErr) {
        console.warn(`Puppeteer DOM audit warning for ${url}:`, auditErr.message);
      }
    };

    await Promise.all([runScreenshot(), runDomAudit()]);
    await page.close();

    return {
      success: screenshotUrl !== null,
      screenshotUrl,
      domAudit
    };

  } catch (error) {
    console.error('Puppeteer Service Critical Error:', error.message);
    if (page) {
      try {
        await page.close();
      } catch (err) {}
    }
    
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

