import { app, BrowserWindow, ipcMain, Menu, protocol } from "electron";
import { existsSync, lstatSync } from "fs";
import { join, resolve } from "path";

Menu.setApplicationMenu(null);

let win: BrowserWindow | null = null;

ipcMain.on("devtool", () => {
  if (!win) return;
  if (!win.webContents.isDevToolsOpened()) win.webContents.openDevTools();
  else win.webContents.closeDevTools();
});

ipcMain.handle("set proxy", async (event, proxy: string) => {
  await win!.webContents.session.setProxy({
    proxyRules: proxy,
  });
  await win!.webContents.session.forceReloadProxyConfig();
});
ipcMain.handle("clear proxy", async () => {
  await win!.webContents.session.setProxy({});
  await win!.webContents.session.forceReloadProxyConfig();
});

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  const preload = resolve(__dirname, "preload.js");

  win = new BrowserWindow({
    title: "Main window",
    icon: app.isPackaged
      ? join(__dirname, "../renderer/favicon.ico")
      : join(__dirname, "../../public/favicon.ico"),
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      preload: existsSync(preload) ? preload : undefined,
    },
  });

  if (process.env.DEV_URL) {
    win.maximize();
    await win.loadURL(process.env.DEV_URL);
    win.webContents.openDevTools();
  } else {
    const website = "app://./";
    const root = resolve(__dirname, "../renderer");

    protocol.registerFileProtocol("app", (req, res) => {
      const path = req.url.slice(website.length);

      let file = resolve(root, path);
      if (!file.startsWith(root))
        return res({
          statusCode: 403,
        });

      if (!existsSync(file) || !lstatSync(file).isFile())
        file = resolve(root, "index.html");
      res(file);
    });

    win.maximize();
    await win.loadURL(website);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});
