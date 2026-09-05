const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listProfiles: () => ipcRenderer.invoke('profiles:list'),
  createProfile: (p) => ipcRenderer.invoke('profiles:create', p),
  updateProfile: (id, updates) => ipcRenderer.invoke('profiles:update', id, updates),
  deleteProfile: (id) => ipcRenderer.invoke('profiles:delete', id),
  wipeProfile: (id) => ipcRenderer.invoke('profiles:wipe', id),
  wipeAllSessions: () => ipcRenderer.invoke('profiles:wipeAll'),
  cloneProfile: (id) => ipcRenderer.invoke('profiles:clone', id),
  testProxy: (proxy) => ipcRenderer.invoke('proxy:test', proxy),
  randomizeFingerprint: (id) => ipcRenderer.invoke('profiles:randomizeFingerprint', id),
  launchProfile: (id) => ipcRenderer.invoke('profiles:launch', id),
  stopProfile: (id) => ipcRenderer.invoke('profiles:stop', id),
  getRunning: () => ipcRenderer.invoke('status:running'),
  getActiveWindows: () => ipcRenderer.invoke('status:running').then((res) => (res && Array.isArray(res.running) ? res.running : [])),
  getChromiumStatus: () => ipcRenderer.invoke('status:chromium'),
  getDataFolder: () => ipcRenderer.invoke('status:dataFolder'),
  openDataFolder: () => ipcRenderer.invoke('status:openDataFolder'),
  downloadChromium: () => ipcRenderer.invoke('chromium:download'),
  detectIpInfo: () => ipcRenderer.invoke('ip:detect'),
  onChromiumProgress: (cb) => {
    const handler = (e, progress) => cb(progress);
    ipcRenderer.on('chromium:progress', handler);
    return () => ipcRenderer.removeListener('chromium:progress', handler);
  },
  onBrowserStatus: (cb) => {
    const handler = (e, snapshot) => cb(snapshot);
    ipcRenderer.on('browser:status', handler);
    return () => ipcRenderer.removeListener('browser:status', handler);
  }
});
