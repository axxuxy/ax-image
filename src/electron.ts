import { app, BrowserWindow, dialog, ipcMain, Menu, protocol } from "electron";
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

ipcMain.handle("select directory", async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ["openDirectory", "createDirectory"],
  });
  return result.filePaths.length ? result.filePaths[0] : undefined;
});

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  const preload = resolve(__dirname, "preload.js");

  win = new BrowserWindow({
    title: "ax-image",
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

  protocol.registerFileProtocol("path", (req, res) => {
    res(req.url.slice(7));
  });

  if (process.env.DEV_URL) {
    win.maximize();
    const vueDevtoolsPath = [
      "AppData/Local/Google/Chrome/User Data/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/6.5.0_0",
      "AppData/Local/Google/Chrome/User Data/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/6.5.0_1",
    ]
      .map((_) => resolve(app.getPath("home"), _))
      .find((_) => existsSync(_));
    if (vueDevtoolsPath) win.webContents.session.loadExtension(vueDevtoolsPath);
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
