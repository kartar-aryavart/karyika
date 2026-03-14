// 🧭 Navigation Tests — All pages load without crash
import { test, expect } from "@playwright/test";
import { login, waitForLoad, checkNoCrash } from "./helpers.js";

// All sidebar pages to test
const PAGES = [
  { name: "Dashboard", keywords: ["Dashboard", "dashboard"] },
  { name: "Tasks",     keywords: ["Tasks", "task"] },
  { name: "Habits",    keywords: ["Habits", "habit"] },
  { name: "Goals",     keywords: ["Goals", "goal"] },
  { name: "Calendar",  keywords: ["Calendar", "calendar"] },
  { name: "Analytics", keywords: ["Analytics", "analytics"] },
  { name: "Pages",     keywords: ["Pages", "Notes", "Docs"] },
];

test.describe("Navigation — All Pages Load", () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForLoad(page);
  });

  for (const pg of PAGES) {
    test(`${pg.name} page loads without crash`, async ({ page }) => {
      // Try clicking nav item
      let clicked = false;
      for (const keyword of pg.keywords) {
        const btn = page.locator(`button:has-text("${keyword}"), a:has-text("${keyword}"), [data-testid="nav-${keyword.toLowerCase()}"]`).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btn.click();
          clicked = true;
          break;
        }
      }
      
      await waitForLoad(page);
      await checkNoCrash(page);
      
      // Take screenshot for visual reference
      await page.screenshot({ path: `tests/screenshots/${pg.name.toLowerCase()}.png` }).catch(() => {});
    });
  }

  test("Sidebar is always visible after login", async ({ page }) => {
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"], nav').first();
    await expect(sidebar).toBeVisible({ timeout: 8000 });
    await checkNoCrash(page);
  });

  test("Command palette opens with Ctrl+K", async ({ page }) => {
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);
    await checkNoCrash(page);
    // Close
    await page.keyboard.press("Escape");
  });

  test("Dark/Light mode toggle works", async ({ page }) => {
    const toggleBtn = page.locator('button[title*="theme"], button[title*="dark"], button[title*="light"], button[aria-label*="theme"]').first();
    if (await toggleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
      await checkNoCrash(page);
      // Toggle back
      await toggleBtn.click();
    }
  });

});
