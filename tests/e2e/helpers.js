// 🛠 Test Helpers & Fixtures
import { expect } from "@playwright/test";

// Test user credentials (use a dedicated test account)
export const TEST_USER = {
  email: process.env.TEST_EMAIL || "test@karyika.app",
  password: process.env.TEST_PASSWORD || "Test@123456",
};

// ── Login helper ──────────────────────────────────────────────────
export async function login(page) {
  await page.goto("/");
  
  // If already logged in, skip
  const isLoggedIn = await page.locator('[data-testid="sidebar"]').isVisible({ timeout: 3000 }).catch(() => false);
  if (isLoggedIn) return;

  // Click login if on landing page
  const loginBtn = page.locator('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login")');
  if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await loginBtn.first().click();
  }

  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
  
  // Wait for app to load
  await page.waitForURL(/dashboard|app/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

// ── Wait for no loading ───────────────────────────────────────────
export async function waitForLoad(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// ── Navigate to a page via sidebar ───────────────────────────────
export async function navTo(page, section) {
  const sel = `[data-testid="nav-${section}"], button:has-text("${section}"), a:has-text("${section}")`;
  await page.click(sel, { timeout: 5000 }).catch(async () => {
    // Try sidebar
    await page.locator(".sidebar").locator(`text=${section}`).click({ timeout: 3000 });
  });
  await waitForLoad(page);
}

// ── Check no crash ────────────────────────────────────────────────
export async function checkNoCrash(page) {
  const errorVisible = await page.locator(':has-text("Kuch toot gaya"), :has-text("toot gaya"), :has-text("is not defined")').isVisible({ timeout: 1000 }).catch(() => false);
  expect(errorVisible, "App should not crash").toBe(false);
}
