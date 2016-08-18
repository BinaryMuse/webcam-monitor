const path = require('path')

const {app, BrowserWindow, Tray, Menu, ipcMain} = require('electron')

const config = {
  alwaysOnTop: true,
  cameras: [],
  selectedCam: null
}

let mainWindow
function createWindow () {
  if (mainWindow) return

  mainWindow = new BrowserWindow({
    width: 640,
    height: 480,
    title: '',
    titleBarStyle: 'hidden',
    movable: true,
    resizable: true,
    show: false,
    alwaysOnTop: config.alwaysOnTop
  })
  mainWindow.loadURL(`file://${__dirname}/index.html`)
}

let tray
let menu
let submenu
function createTray () {
  tray = new Tray(path.resolve(__dirname, 'tray-icon.png'))
  menu = buildMenu()
  tray.on('click', handleTrayClick)
  tray.on('right-click', handleTrayRightClick)
}

function buildMenu () {
  submenu = buildCameraSubmenu()
  menu = Menu.buildFromTemplate([
    {label: 'Select Camera', submenu: submenu},
    {label: 'Always on Top', type: 'checkbox', checked: config.alwaysOnTop, click: handleToggleAlwaysOnTop},
    {type: 'separator'},
    {role: 'quit'}
  ])
  return menu
}

function buildCameraSubmenu () {
  if (!config.cameras.length) {
    return Menu.buildFromTemplate([
      {label: 'No Cameras Detected', enabled: false}
    ])
  }

  return Menu.buildFromTemplate(config.cameras.map(cam => {
    return {label: cam.label, type: 'radio', checked: config.selectedCam === cam.deviceId, click: item => {
      submenu.items.forEach(item => item.checked = false)
      item.checked = true
      selectCamera(cam.deviceId)
    }}
  }))
}

function handleTrayClick () {
  toggleWindow()
}

function handleTrayRightClick () {
  tray.popUpContextMenu(menu)
}

function toggleWindow () {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
  }
}

function handleUpdateCameraList (event, cameras) {
  const currentLength = config.cameras.length
  config.cameras = cameras

  if (currentLength === 0 && config.cameras.length !== 0) {
    selectCamera(config.cameras[0].deviceId)
  }
  menu = buildMenu()
}

function selectCamera (cameraId) {
  config.selectedCam = cameraId
  mainWindow.webContents.send('select-camera', cameraId)
}

function handleQuerySelectedCamera () {
  mainWindow.webContents.send('select-camera', config.selectedCam)
}

function handleToggleAlwaysOnTop (menuItem) {
  config.alwaysOnTop = menuItem.checked
  mainWindow.setAlwaysOnTop(config.alwaysOnTop)
}

app.on('ready', () => {
  createWindow()
  createTray()
  ipcMain.on('update-camera-list', handleUpdateCameraList)
  ipcMain.on('query-selected-camera', handleQuerySelectedCamera)
})
