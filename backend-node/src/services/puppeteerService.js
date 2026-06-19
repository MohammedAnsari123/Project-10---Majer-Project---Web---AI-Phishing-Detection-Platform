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
      await browserInstance.version();
      return browserInstance;
    } catch (e) {
      console.warn('Cached browser instance is non-responsive. Relaunching...');

      try {
        await browserInstance.close();
      } catch (err) {}

      browserInstance = null;
    }
  }

  browserInstance = await puppeteer.launch({
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--ignore-certificate-errors'
    ]
  });

  return browserInstance;
}

// Clean exit hooks
process.on('exit', async () => {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (err) {}
  }
});

process.on('SIGINT', async () => {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (err) {}
  }
  process.exit();
});

process.on('SIGTERM', async () => {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (err) {}
  }
  process.exit();
});

async function captureScreenshotAndScanDOM(url) {
  let page = null;

  const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;
  const savePath = path.join(SCREENSHOT_DIR, filename);

  try {
    const browser = await getBrowser();

    page = await browser.newPage();

    // Global timeouts
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    await page.setViewport({
      width: 1280,
      height: 720
    });

    // Avoid simple bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    let pageLoaded = true;

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Allow rendering to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (gotoErr) {
      console.warn(
        `Puppeteer page.goto warning for ${url}:`,
        gotoErr.message
      );

      // Navigation timeout often means page partially loaded
      // 
       if (
  gotoErr.message.toLowerCase().includes('timeout')
) {
        pageLoaded = true;
      } else {
        pageLoaded = false;
      }
    }

    if (!pageLoaded) {
      try {
        await page.close();
      } catch (err) {}

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
        const screenshotPromise = page.screenshot({
          path: savePath,
          fullPage: false,
          type: 'jpeg',
          quality: 70
        });

        const screenshotTimeout = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Screenshot capture timed out')),
            15000
          )
        );

        await Promise.race([
          screenshotPromise,
          screenshotTimeout
        ]);

        screenshotUrl = `/screenshots/${filename}`;

      } catch (err) {
        console.warn(
          `Puppeteer page.screenshot warning for ${url}:`,
          err.message
        );
      }
    };

    const runDomAudit = async () => {
      try {
        const auditPromise = page.evaluate(() => {
          const inputs = Array.from(
            document.querySelectorAll('input')
          );

          const hasPasswordInput = inputs.some(
            input => input.type === 'password'
          );

          const hasCardInput = inputs.some(input => {
            const name = (input.name || '').toLowerCase();
            const placeholder = (
              input.placeholder || ''
            ).toLowerCase();

            return (
              name.includes('card') ||
              placeholder.includes('card') ||
              name.includes('cc') ||
              name.includes('cvv')
            );
          });

          const forms = Array.from(
            document.querySelectorAll('form')
          );

          const hasSubmitForm = forms.length > 0;

          const keywords = [
            'login',
            'verify',
            'bank',
            'secure',
            'signin',
            'paypal',
            'account'
          ];

          const bodyText = document.body
            ? document.body.innerText.toLowerCase()
            : '';

          const matchedKeywords = keywords.filter(keyword =>
            bodyText.includes(keyword)
          );

          return {
            hasPasswordInput,
            hasCardInput,
            hasSubmitForm,
            matchedKeywords,
            inputCount: inputs.length
          };
        });

        const auditTimeout = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('DOM audit timed out')),
            5000
          )
        );

        domAudit = await Promise.race([
          auditPromise,
          auditTimeout
        ]);

      } catch (err) {
        console.warn(
          `Puppeteer DOM audit warning for ${url}:`,
          err.message
        );
      }
    };

    await Promise.all([
      runScreenshot(),
      runDomAudit()
    ]);

    try {
      await page.close();
    } catch (err) {}

    return {
      success: screenshotUrl !== null,
      screenshotUrl,
      domAudit
    };

  } catch (error) {
    console.error(
      'Puppeteer Service Critical Error:',
      error.message
    );

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

module.exports = {
  captureScreenshotAndScanDOM
};