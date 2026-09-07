const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: false } });
  await win.loadFile(path.join(__dirname, '../../index.html'));
  const res = await win.webContents.executeJavaScript(`
    (() => {
      document.getElementById('profileModal').hidden = false;
      const modal = document.querySelector('.modal');
      const label = document.querySelector('.field label');
      const input = document.querySelector('.field input[type=text]');
      const tabGeneral = document.getElementById('tabGeneral');
      const tabFingerprint = document.getElementById('tabFingerprint');
      const scrollBody = document.querySelector('.modal-body-scroll');
      return {
        modalBg: getComputedStyle(modal).backgroundColor,
        modalColor: getComputedStyle(modal).color,
        labelColor: label ? getComputedStyle(label).color : 'none',
        inputBg: input ? getComputedStyle(input).backgroundColor : 'none',
        inputColor: input ? getComputedStyle(input).color : 'none',
        scrollBodyHeight: scrollBody ? getComputedStyle(scrollBody).height : 'none',
        scrollBodyDisplay: scrollBody ? getComputedStyle(scrollBody).display : 'none',
        tabGeneralDisplay: getComputedStyle(tabGeneral).display,
        tabFingerprintDisplay: getComputedStyle(tabFingerprint).display,
        tabGeneralOpacity: getComputedStyle(tabGeneral).opacity
      };
    })()
  `);
  console.log('STYLES_CHECK:', JSON.stringify(res, null, 2));
  app.quit();
});
