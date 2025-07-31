const puppeteer = require('puppeteer');

async function debugDashboard() {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Listen for console logs
    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });
    
    // Listen for errors
    page.on('error', err => {
      console.log('PAGE ERROR:', err.message);
    });
    
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
    });
    
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for the page to fully load
    await page.waitForTimeout(5000);
    
    // Check what's visible
    const content = await page.evaluate(() => {
      return {
        title: document.title,
        h1Text: document.querySelector('h1')?.textContent,
        statsCards: Array.from(document.querySelectorAll('.bg-gray-800')).map(card => ({
          title: card.querySelector('h2, h3')?.textContent,
          content: card.textContent
        })),
        buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent),
        hasWelcome: document.textContent.includes('Welcome back'),
        hasLoadingText: document.textContent.includes('Loading...'),
        bodyClass: document.body.className
      };
    });
    
    console.log('Dashboard content:', JSON.stringify(content, null, 2));
    
    // Take a screenshot
    await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });
    console.log('Screenshot saved as dashboard-debug.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugDashboard();