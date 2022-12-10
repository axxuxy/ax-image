import { test, expect, _electron } from "@playwright/test";
import { resolve } from "path";

// eslint-disable-next-line no-empty-pattern
test("test electron app", async function ({}, info) {
  /// Start electron.
  const electronApp = await _electron.launch({
    args: ["."],
  });

  electronApp.on("window", () => {
    console.log("electron app on window.");
  });
  electronApp.on("close", console.log);

  /// Get dir of electron run main file.
  const path = await electronApp.evaluate(async ({ app }) => app.getAppPath());
  console.log("electron path", path);

  /// Out log electron window count.
  console.log("electronApp.windows().length", electronApp.windows().length);

  /// Get page.
  const page = await electronApp.firstWindow();
  console.log("get window");

  /// Page log output to this console.
  page.on("console", console.log);

  /// Save index page img.
  const indexPageImg = resolve(info.project.outputDir, "index.png");
  await page.screenshot({ path: indexPageImg });
  /// Expect page info.
  await expect(page).toHaveTitle("ax-image");
  expect(new URL(page.url()).pathname).toBe("/");

  /// Close this app.
  await electronApp.close();
});
