// 🐛 Regression Tests — Known bugs that were fixed
// Har baar naye bug fix ke baad yahan test add karo
import { test, expect } from "@playwright/test";
import { login, waitForLoad, checkNoCrash } from "./helpers.js";

test.describe("Regression — Previously Fixed Bugs", () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForLoad(page);
  });

  // BUG #1: "onboarded is not defined" crash
  test("App loads without onboarded crash", async ({ page }) => {
    await page.goto("/");
    await waitForLoad(page);
    const crash = await page.locator(':has-text("onboarded is not defined")').isVisible({ timeout: 2000 }).catch(() => false);
    expect(crash, "onboarded crash should not happen").toBe(false);
  });

  // BUG #2: "handleDuplicate is not defined" on task click
  test("Task click does not crash with handleDuplicate error", async ({ page }) => {
    await page.click('button:has-text("Tasks"), a:has-text("Tasks")').catch(() => {});
    await waitForLoad(page);
    
    // Add a task first
    const input = page.locator('input[placeholder*="Task"], input[placeholder*="task"]').first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill("Regression test task");
      await input.press("Enter");
      await waitForLoad(page);
      
      // Click task
      const taskRow = page.locator('[class*="task"]').first();
      if (await taskRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await taskRow.click();
        await page.waitForTimeout(800);
        const crash = await page.locator(':has-text("handleDuplicate is not defined")').isVisible({ timeout: 1000 }).catch(() => false);
        expect(crash, "handleDuplicate crash should not happen").toBe(false);
      }
    }
  });

  // BUG #3: Firebase Timestamp .localeCompare crash
  test("Tasks with Firebase timestamps dont crash", async ({ page }) => {
    await page.click('button:has-text("Tasks"), a:has-text("Tasks")').catch(() => {});
    await waitForLoad(page);
    await checkNoCrash(page);
    // If we got here without crash, timestamps are handled
  });

  // BUG #4: Blank screen on first load
  test("No blank screen on app load", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    // Page should have some visible content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(10);
    await checkNoCrash(page);
  });

  // BUG #5: Auth redirect loop
  test("No infinite redirect loop on login", async ({ page }) => {
    await page.goto("/");
    // Count navigations — should not loop
    let navCount = 0;
    page.on("framenavigated", () => navCount++);
    await page.waitForTimeout(4000);
    expect(navCount).toBeLessThan(10);
  });

});
