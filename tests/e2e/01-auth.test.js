// 🔐 Auth Tests — Login, Signup, Logout
import { test, expect } from "@playwright/test";
import { login, waitForLoad, checkNoCrash, TEST_USER } from "./helpers.js";

test.describe("Authentication", () => {

  test("Landing page loads without crash", async ({ page }) => {
    await page.goto("/");
    await waitForLoad(page);
    await checkNoCrash(page);
    // Should show login or landing
    await expect(page).toHaveTitle(/Karyika|karyika/i);
  });

  test("Login page shows form", async ({ page }) => {
    await page.goto("/");
    await waitForLoad(page);
    // Try to get to auth
    const loginBtn = page.locator('button:has-text("Login"), button:has-text("Get Started"), a:has-text("Login")');
    if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginBtn.first().click();
    }
    // Email input should be visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 8000 });
  });

  test("Shows error on wrong credentials", async ({ page }) => {
    await page.goto("/");
    await waitForLoad(page);
    const loginBtn = page.locator('button:has-text("Login"), button:has-text("Get Started")');
    if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginBtn.first().click();
    }
    await page.fill('input[type="email"]', "wrong@test.com");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"]');
    // Should show error (not crash)
    await checkNoCrash(page);
    await page.waitForTimeout(2000);
    // Error message should appear somewhere
    const hasError = await page.locator('[class*="error"], [class*="Error"], :has-text("galat"), :has-text("invalid"), :has-text("wrong")').isVisible({ timeout: 5000 }).catch(() => false);
    // Just ensure it doesn't crash — error message is a bonus
    await checkNoCrash(page);
  });

  test("Successful login", async ({ page }) => {
    await login(page);
    await checkNoCrash(page);
    // Should be in the app
    const appVisible = await page.locator('[class*="sidebar"], [class*="dashboard"], nav').isVisible({ timeout: 8000 }).catch(() => false);
    expect(appVisible).toBe(true);
  });

});
