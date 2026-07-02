import { test, expect } from '@playwright/test';

// Configuration for generating a report dynamically
const reportLogs: string[] = [];
function logToReport(message: string) {
    console.log(message);
    reportLogs.push(message);
}

test.describe('SideBy.ink End-to-End Functionality and Performance Test', () => {

    test.afterAll(() => {
        // We log everything here so the calling shell script can redirect this to TEST_REPORT.md
        console.log("\n\n=== FINAL DYNAMIC REPORT ===");
        console.log("# SideBy.ink Playwright Test Report\n");
        console.log(reportLogs.join('\n'));
    });

    test('Desktop Experience - Load, Errors, and Performance', async ({ page }) => {
        logToReport('## Desktop Experience');
        const errors: string[] = [];
        const consoleMessages: string[] = [];

        page.on('pageerror', err => {
            errors.push(err.message);
        });

        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
            }
        });

        logToReport('Navigating to https://sideby.ink...');
        const startTime = Date.now();
        await page.goto('https://sideby.ink');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        logToReport(`- **Full NetworkIdle Load Time**: ${loadTime}ms`);

        // Check if there are inputs
        const inputs = await page.locator('input').count();
        logToReport(`- **Search Inputs Found**: ${inputs}`);

        if (inputs > 0) {
            logToReport('- Attempting to type "Software Comparison" into the main input.');
            await page.locator('input').first().fill('Software Comparison');
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000); // wait for any dynamic results or navigation
        } else {
             const buttons = await page.locator('button').count();
             logToReport(`- No inputs found on homepage. Found ${buttons} buttons instead. Clicking a prominent button if available.`);
             if (buttons > 0) {
                // Try clicking the first non-empty button
                await page.locator('button').first().click({ force: true }).catch(() => {});
                await page.waitForTimeout(2000);
             }
        }

        // Output Errors
        logToReport(`- **Client-side Exceptions**: ${errors.length > 0 ? errors.join(', ') : 'None'}`);
        logToReport(`- **Console Warnings/Errors**: ${consoleMessages.length > 0 ? consoleMessages.join(' | ') : 'None'}`);

        expect(errors.length).toBe(0);
    });

});

// To simulate mobile, playwright handles it via configuration.
// We will test mobile explicitly here in the same file.
test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });

    test('Mobile - Load and Interaction', async ({ page }) => {
        logToReport('\n## Mobile Experience (iPhone 13 emulation)');
        const errors: string[] = [];

        page.on('pageerror', err => {
            errors.push(err.message);
        });

        const startTime = Date.now();
        await page.goto('https://sideby.ink');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        logToReport(`- **Full NetworkIdle Load Time**: ${loadTime}ms`);
        logToReport(`- **Client-side Exceptions**: ${errors.length > 0 ? errors.join(', ') : 'None'}`);

        expect(errors.length).toBe(0);
    });
});
