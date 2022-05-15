const { fileExists, injectCSS } = require("./plugins/utils");
const { app, BrowserWindow } = require("electron");
const { setApplicationMenu } = require("./menu");
const config = require("./config");
const is = require("electron-is");
const path = require("path");

dev = true;

const createWindow = () => {
    
	const windowSize = config.get("window-size");
	const useInlineMenu = config.plugins.isEnabled("in-app-menu");
    const win = new BrowserWindow({
		icon: path.join(__dirname, "assets", "favicon.png"),
        width: windowSize.width,
        height: windowSize.height,
		titleBarStyle: useInlineMenu
			? "hidden"
			: is.macOS()
			? "hiddenInset"
			: "default",
		autoHideMenuBar: config.get("options.hideMenu"),
		backgroundColor: "#000",
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, "preload.js"),
			nativeWindowOpen: true,
			affinity: "main-window",
		}
    });

    win.webContents.loadURL(config.defaultConfig.url);
};

function loadPlugins(win) {
    // Going to be 100 with you I stole this from another electron project
	injectCSS(win.webContents, path.join(__dirname,"themes", "main.css"));
	win.webContents.once("did-finish-load", () => {
		if (dev) {
			console.log("did finish load");
			win.webContents.openDevTools();
		}
	});

	config.plugins.getEnabled().forEach(([plugin, options]) => {
		console.log("Loaded plugin - " + plugin);
		const pluginPath = path.join(__dirname, "plugins", plugin, "back.js");
		fileExists(pluginPath, () => {
			const handle = require(pluginPath);
			handle(win, options);
		});
	});
}

app.once("browser-window-created", (event, win) => {
    loadPlugins(win);
});

app.whenReady().then(() => {
    mainWin = createWindow();
    setApplicationMenu(mainWin);
});
