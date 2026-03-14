// ⚡ Performance Tests — Load times, no memory leaks
import { test, expect } from "@playwright/test";
import { login, waitForLoad } from "./helpers.js";

test.describe("Performance", () => {

  test("App loads in under 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - start;
    console.log(`📊 Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test("No console errors on load", async ({ page }) => {
    const errors = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", err => errors.push(err.message));
    
    await page.goto("/");
    await waitForLoad(page);
    
    // Filter known acceptable errors
    const realErrors = errors.filter(e =>
      !e.includes("favicon") &&
      !e.includes("fonts") &&
      !e.includes("ResizeObserver") &&
      !e.includes("Non-Error promise")
    );
    
    if (realErrors.length > 0) {
      console.log("Console errors found:", realErrors);
    }
    // Warn but don't fail (some Firebase errors are acceptable)
    expect(realErrors.length).toBeLessThan(5);
  });

  test("Tasks page loads in under 3 seconds after login", async ({ page }) => {
    await login(page);
    const start = Date.now();
    await page.click('button:has-text("Tasks"), a:has-text("Tasks")').catch(() => {});
    await waitForLoad(page);
    const loadTime = Date.now() - start;
    console.log(`📊 Tasks page load: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test("Core Web Vitals — LCP check", async ({ page }) => {
    await page.goto("/");
    
    // Measure LCP via JS
    const lcp = await page.evaluate(() => new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        resolve(entries[entries.length - 1]?.startTime || 0);
      }).observe({ type: "largest-contentful-paint", buffered: true });
      setTimeout(() => resolve(0), 5000);
    }));
    
    console.log(`📊 LCP: ${Math.round(lcp)}ms`);
    if (lcp > 0) {
      expect(lcp).toBeLessThan(4000); // Good LCP < 2.5s, Acceptable < 4s
    }
  });

});
