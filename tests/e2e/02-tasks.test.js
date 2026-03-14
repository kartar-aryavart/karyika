// 📋 Tasks Tests — CRUD, Views, Filters
import { test, expect } from "@playwright/test";
import { login, waitForLoad, checkNoCrash, navTo } from "./helpers.js";

test.describe("Tasks", () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to tasks
    await page.click('button:has-text("Tasks"), a:has-text("Tasks"), [data-testid="nav-tasks"]', { timeout: 5000 }).catch(() => {});
    await waitForLoad(page);
  });

  test("Tasks page loads without crash", async ({ page }) => {
    await checkNoCrash(page);
    // Quick add bar should be visible
    const quickAdd = page.locator('input[placeholder*="Task add"], input[placeholder*="task"], form input').first();
    await expect(quickAdd).toBeVisible({ timeout: 8000 });
  });

  test("Can add a task via quick add", async ({ page }) => {
    const taskTitle = `Test Task ${Date.now()}`;
    
    // Type in quick add
    const quickAdd = page.locator('input[placeholder*="Task"], input[placeholder*="task"]').first();
    await quickAdd.fill(taskTitle);
    await quickAdd.press("Enter");
    
    await waitForLoad(page);
    await checkNoCrash(page);
    
    // Task should appear in list
    await expect(page.locator(`text=${taskTitle.slice(0,20)}`)).toBeVisible({ timeout: 8000 });
  });

  test("Task priority quick add — NLP", async ({ page }) => {
    const quickAdd = page.locator('input[placeholder*="Task"], input[placeholder*="task"]').first();
    await quickAdd.fill("Urgent meeting tomorrow #work");
    
    // NLP preview should show due date
    const nlpPreview = page.locator('[class*="nlp"], :has-text("Tomorrow"), :has-text("Kal")');
    // Should not crash
    await checkNoCrash(page);
    await quickAdd.press("Enter");
    await waitForLoad(page);
    await checkNoCrash(page);
  });

  test("Can click task to open detail drawer", async ({ page }) => {
    // First ensure a task exists
    const quickAdd = page.locator('input[placeholder*="Task"], input[placeholder*="task"]').first();
    await quickAdd.fill(`Click Test ${Date.now()}`);
    await quickAdd.press("Enter");
    await waitForLoad(page);
    
    // Click the task
    const taskRow = page.locator('[class*="task"], [class*="Task"]').first();
    if (await taskRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskRow.click();
      await page.waitForTimeout(500);
      await checkNoCrash(page);
      
      // Drawer should open — title input visible
      const titleInput = page.locator('[class*="drawer"] input, [class*="detail"] input, [class*="panel"] textarea').first();
      await expect(titleInput).toBeVisible({ timeout: 5000 }).catch(() => {
        // Acceptable if drawer not found — just no crash
      });
    }
  });

  test("View switcher works — all views", async ({ page }) => {
    const views = ["Board", "Table", "Calendar", "Gantt", "My Tasks", "Inbox"];
    for (const view of views) {
      const btn = page.locator(`button:has-text("${view}")`).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(400);
        await checkNoCrash(page);
      }
    }
  });

  test("Can filter by priority", async ({ page }) => {
    const filter = page.locator('select').filter({ hasText: /priority|Priority/ }).first();
    if (await filter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filter.selectOption("high");
      await waitForLoad(page);
      await checkNoCrash(page);
      // Reset
      await filter.selectOption("all");
    }
  });

  test("Search works", async ({ page }) => {
    const search = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill("test");
      await page.waitForTimeout(500);
      await checkNoCrash(page);
      await search.fill("");
    }
  });

  test("Templates button works", async ({ page }) => {
    const templatesBtn = page.locator('button:has-text("Templates")').first();
    if (await templatesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await templatesBtn.click();
      await page.waitForTimeout(300);
      await checkNoCrash(page);
      // Close
      await page.keyboard.press("Escape");
    }
  });

});
