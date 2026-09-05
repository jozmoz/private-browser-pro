(function () {
  'use strict';

  var COLORS = ['#4f8cff', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#ec4899', '#14b8a6', '#eab308'];

  var GPU_MAP = {
    // NVIDIA GeForce
    'nvidia-rtx4090': {
      name: 'NVIDIA GeForce RTX 4090',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'nvidia-rtx4080': {
      name: 'NVIDIA GeForce RTX 4080',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'nvidia-rtx4070': {
      name: 'NVIDIA GeForce RTX 4070',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'nvidia-rtx4060ti': {
      name: 'NVIDIA GeForce RTX 4060 Ti',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'nvidia-rtx3080': {
      name: 'NVIDIA GeForce RTX 3080',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'nvidia-rtx3070': {
      name: 'NVIDIA GeForce RTX 3070',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'nvidia-rtx3060': {
      name: 'NVIDIA GeForce RTX 3060',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'nvidia-rtx3050-lap': {
      name: 'NVIDIA GeForce RTX 3050 Laptop GPU',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'nvidia-gtx1660s': {
      name: 'NVIDIA GeForce GTX 1660 SUPER',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    // AMD Radeon
    'amd-rx7900xtx': {
      name: 'AMD Radeon RX 7900 XTX',
      vendor: 'Google Inc. (AMD)',
      renderer: 'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'amd-rx7800': {
      name: 'AMD Radeon RX 7800 XT',
      vendor: 'Google Inc. (AMD)',
      renderer: 'ANGLE (AMD, AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'amd-rx6700xt': {
      name: 'AMD Radeon RX 6700 XT',
      vendor: 'Google Inc. (AMD)',
      renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'amd-rx6600': {
      name: 'AMD Radeon RX 6600',
      vendor: 'Google Inc. (AMD)',
      renderer: 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    // Intel
    'intel-arc-a770': {
      name: 'Intel(R) Arc(TM) A770 Graphics',
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'intel-arc-a750': {
      name: 'Intel(R) Arc(TM) A750 Graphics',
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) Arc(TM) A750 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'intel-iris-xe': {
      name: 'Intel(R) Iris(R) Xe Graphics',
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A8) Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    'intel-uhd-770': {
      name: 'Intel(R) UHD Graphics 770',
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    // Apple Silicon
    'apple-m3-max': {
      name: 'Apple M3 Max',
      vendor: 'Apple Inc.',
      renderer: 'ANGLE (Apple, Apple M3 Max, OpenGL 4.1)'
    },
    'apple-m3': {
      name: 'Apple M3 Pro',
      vendor: 'Apple Inc.',
      renderer: 'ANGLE (Apple, Apple M3 Pro, OpenGL 4.1)'
    },
    'apple-m2-pro': {
      name: 'Apple M2 Pro',
      vendor: 'Apple Inc.',
      renderer: 'ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)'
    },
    'apple-m1': {
      name: 'Apple M1',
      vendor: 'Apple Inc.',
      renderer: 'ANGLE (Apple, Apple M1, OpenGL 4.1)'
    }
  };

  var currentLang = localStorage.getItem('app_lang') || 'en';

  var I18N = {
    en: {
      appTitle: 'Private Browser Pro',
      appSubtitle: 'Dedicated Digital Identity (Anti-Detect) • Zero-Data & Persistent Privacy Engine',
      langToggle: '🌐 فارسی',
      browserEngine: 'Browser Engine:',
      execMode: 'Mode:',
      execZeroData: '🔒 100% Zero-Data Ephemeral',
      runningCount: 'Active:',
      wipeAllBtn: '🧹 Clean All Sessions',
      dataFolderBtn: 'Data Folder',
      downloadChromiumBtn: 'Download Browser',
      searchPlaceholder: 'Search profile name, tags, or hardware identity...',
      filterByTag: '🏷️ Filter by Tag:',
      all: 'All',
      emptyTitle: 'No browser profiles yet',
      emptyDesc: 'Create your first private profile. Each browser has a dedicated digital identity and preserves your logins & history.',
      emptyBtn: 'Create First Profile',
      newCardTitle: 'New Profile',
      newCardDesc: 'Create an isolated browser identity',
      noResTitle: 'No profiles found',
      noResDesc: 'Try searching for another name, tag, or GPU spec.',
      footerCredit: 'Private Browser Pro | Anti-Detect & Zero-Data',
      confirm: 'Confirm',
      cancel: 'Cancel',
      createTitle: 'Create New Profile',
      editTitle: 'Edit Profile',
      saveCreate: 'Create Profile',
      saveEdit: 'Save Changes',
      deleteProfileBtn: '🗑 Delete Profile',
      neverLaunched: 'Never launched',
      lastLaunched: 'Last launched',
      deleteTitle: 'Delete Profile',
      deleteMsg: 'Are you sure you want to delete profile "{name}" and its identity?',
      wipeTitle: 'Wipe Profile Data',
      wipeMsg: 'Wipe all saved cookies, sessions, and temporary files for "{name}"?',
      wipeAllTitle: 'Wipe All Sessions and Data',
      wipeAllMsg: 'Are you sure? All running browsers will stop and all cache, cookies, and session folders will be purged.',
      activeBadge: '● Active',
      launchBtn: '▶ Launch Profile',
      stopBtn: '⏹ Stop Browser',
      launching: 'Launching…',
      stopping: 'Stopping…',
      cloneBtn: '📋 Clone',
      editBtn: '✎ Edit',
      randomizeBtn: '🎲 New Identity',
      wipeBtn: '🧹 Wipe',
      deleteBtn: '🗑 Delete',
      persistentChip: '💾 Persistent Data',
      ephemeralChip: '⚡ Ephemeral',
      engineReady: '● Chromium engine is ready',
      engineNotFound: '● Browser not found — download required',
      noBrowserBanner: 'No browser found on the system. Download Chromium or install Edge/Chrome to launch profiles.',
      dismiss: 'Dismiss',
      downloadPreparing: 'Preparing download…',
      secGeneral: '1. General Information',
      lblProfileName: 'Profile Name',
      placeholderName: 'e.g.: Main Account, Trading, Telegram, Work',
      maxChars: 'max 60 characters',
      lblColorTag: 'Color Tag',
      lblStartupUrl: 'Startup URL',
      lblStartupUrlOptional: '(Optional - Default: Secure Start Page)',
      hintStartupUrl: 'If left empty, the secure private start page will open.',
      lblSaveData: '💾 Persistent Storage (History, cookies, and logins remain saved)',
      hintSaveData: 'When enabled, accounts and cookies persist across sessions. When unchecked, session is 100% ephemeral and destroyed on close.',
      lblTags: 'Tags',
      lblTagsOptional: '(Comma separated - e.g.: Crypto, Work, Social)',
      placeholderTags: 'Crypto, Social, Main',
      lblNotes: 'Notes & Reminders',
      lblOptional: '(Optional)',
      placeholderNotes: 'Account notes, recovery email, credentials reminder...',
      secFingerprint: '2. Digital Identity & Anti-Detect Fingerprint',
      btnAutoDetectIp: '⚡ Auto-Detect with IP',
      btnSmartRandomize: '🎲 Smart Randomize',
      lblOs: 'Operating System',
      lblResolution: 'Monitor Resolution',
      lblTimezone: 'Timezone (Sync with IP / Proxy)',
      lblLanguage: 'Browser Language',
      lblGpu: 'Graphics Card & WebGL Renderer',
      lblCores: 'CPU Cores',
      lblMemory: 'Device Memory (RAM)',
      chkCaptchaSafe: '🛡️ Cloudflare Turnstile & Captcha Safe Compatibility',
      chkCanvasNoise: 'Canvas Noise Protection',
      chkAudioNoise: 'AudioContext Noise Protection',
      chkWebglNoise: 'WebGL Buffer Emulation',
      chkWebrtcProtection: 'WebRTC IP Leak Protection',
      chkDnsProtection: '🔒 DNS Leak Protection & Secure DoH',
      secProxy: '3. Proxy Settings (Optional)',
      chkProxyEnabled: 'Use dedicated proxy for this browser',
      lblProxyType: 'Proxy Type',
      lblProxyHost: 'Host / Server IP',
      lblProxyPort: 'Port',
      lblProxyUser: 'Username',
      lblProxyPass: 'Password',
      btnTestProxy: '⚡ Test Proxy Connection',
      noteTitle: 'Private Browser Pro Isolation & Storage:',
      noteDesc: 'In persistent mode, logins and cookies are isolated in dedicated profile storage. In ephemeral mode, all session data is permanently destroyed upon browser exit.'
    },
    fa: {
      appTitle: 'مرورگر ضدتشخیص پیشرفته',
      appSubtitle: 'هویت دیجیتال اختصاصی (Anti-Detect) • تضمین نشست فوق‌امنیتی بدون داده (Zero-Data)',
      langToggle: '🌐 English',
      browserEngine: 'موتور مرورگر:',
      execMode: 'حالت اجرا:',
      execZeroData: '🔒 ۱۰۰٪ بدون داده (Zero-Data Ephemeral)',
      runningCount: 'در حال اجرا:',
      wipeAllBtn: '🧹 پاک‌سازی همه نشست‌ها',
      dataFolderBtn: 'پوشه داده‌ها',
      downloadChromiumBtn: 'دانلود مرورگر',
      searchPlaceholder: 'جست‌وجو در نام مرورگر، تگ‌ها یا مشخصات هویت…',
      filterByTag: '🏷️ فیلتر بر اساس تگ:',
      all: 'همه',
      emptyTitle: 'هنوز هیچ مرورگری نساخته‌اید',
      emptyDesc: 'اولین پروفایل خصوصی خود را بسازید؛ هر مرورگر دارای اثرانگشت دیجیتال اختصاصی بوده و تاریخچه و کوکی‌های شما به صورت امن ذخیره می‌ماند.',
      emptyBtn: 'ساخت اولین مرورگر',
      newCardTitle: 'مرورگر جدید',
      newCardDesc: 'ساخت پروفایل با هویت مجزا و تفکیک کامل',
      noResTitle: 'نتیجه‌ای پیدا نشد',
      noResDesc: 'نام، تگ یا مشخصه دیگری را جست‌وجو کنید.',
      footerCredit: 'مرورگر امن اختصاصی | Zero-Data & Anti-Detect',
      confirm: 'تأیید',
      cancel: 'انصراف',
      createTitle: 'ساخت مرورگر جدید',
      editTitle: 'ویرایش مرورگر',
      saveCreate: 'ساخت مرورگر',
      saveEdit: 'ذخیره تغییرات',
      deleteProfileBtn: '🗑 حذف این مرورگر',
      neverLaunched: 'هرگز اجرا نشده',
      lastLaunched: 'آخرین اجرا',
      deleteTitle: 'حذف مرورگر',
      deleteMsg: 'مرورگر «{name}» به همراه هویت اختصاصی آن حذف شود؟',
      wipeTitle: 'پاک‌سازی داده‌های موقت مرورگر',
      wipeMsg: 'تمامی نشست‌ها، فایل‌های موقت و ردپاهای ذخیره‌شده مرورگر «{name}» پاک‌سازی شوند؟',
      wipeAllTitle: 'پاک‌سازی کامل همه نشست‌ها و داده‌ها',
      wipeAllMsg: 'آیا اطمینان دارید؟ تمامی مرورگرهای در حال اجرا متوقف شده و کلیه پوشه‌های موقت، کوکی‌ها و فایل‌های نشست به طور قطعی منهدم خواهند شد.',
      activeBadge: '● فعال',
      launchBtn: '▶ اجرای امن',
      stopBtn: '⏹ توقف مرورگر',
      launching: 'در حال آماده‌سازی…',
      stopping: 'در حال توقف…',
      cloneBtn: '📋 تکثیر',
      editBtn: '✎ ویرایش',
      randomizeBtn: '🎲 هویت جدید',
      wipeBtn: '🧹 پاک‌سازی',
      deleteBtn: '🗑 حذف',
      persistentChip: '💾 داده پایدار',
      ephemeralChip: '⚡ یک‌بار مصرف',
      engineReady: '● موتور کرومیوم آماده است',
      engineNotFound: '● مرورگری یافت نشد — دانلود لازم است',
      noBrowserBanner: 'هیچ مرورگری روی سیستم پیدا نشد. برای اجرای پروفایل‌ها، کرومیوم را دانلود کنید یا اج/کروم نصب کنید.',
      dismiss: 'بستن',
      downloadPreparing: 'در حال آماده‌سازی دانلود…',
      secGeneral: '۱. اطلاعات عمومی مرورگر',
      lblProfileName: 'نام مرورگر',
      placeholderName: 'مثلاً: اکانت شماره ۱، ترید، تلگرام، اینستاگرام',
      maxChars: 'حداکثر ۶۰ نویسه',
      lblColorTag: 'رنگ نشانگر',
      lblStartupUrl: 'آدرس شروع',
      lblStartupUrlOptional: '(اختیاری - پیش‌فرض: برگه شروع امن)',
      hintStartupUrl: 'در صورت خالی بودن، صفحه شروع امن و اختصاصی مرورگر باز می‌شود.',
      lblSaveData: '💾 ذخیره‌سازی دائمی تاریخچه، کوکی‌ها و لاگین‌های مرورگر (Persistent Data)',
      hintSaveData: 'در صورت فعال بودن، حساب‌ها، تاریخچه و کوکی‌ها بعد از بستن مرورگر ذخیره می‌مانند. اگر خاموش باشد، مرورگر یک‌بار مصرف خواهد بود.',
      lblTags: 'برچسب‌ها (Tags)',
      lblTagsOptional: '(با کاما جدا کنید - مثلاً: اینستاگرام، ترید، گوگل)',
      placeholderTags: 'اینستاگرام، کریپتو، اکانت اصلی',
      lblNotes: 'یادداشت‌ها و نکات کاربری (Notes)',
      lblOptional: '(اختیاری)',
      placeholderNotes: 'یادداشت‌های اختصاصی، ایمیل بازیابی، نکات اکانت...',
      secFingerprint: '۲. هویت دیجیتال و اثر انگشت (Anti-Detect Fingerprint)',
      btnAutoDetectIp: '⚡ تنظیم خودکار با آی‌پی',
      btnSmartRandomize: '🎲 تولید هویت هوشمند',
      lblOs: 'سیستم‌عامل فرضی',
      lblResolution: 'وضوح مانیتور (Resolution)',
      lblTimezone: 'منطقه زمانی (Timezone - مطابق با آی‌پی/پروکسی)',
      lblLanguage: 'زبان مرورگر (Language)',
      lblGpu: 'کارت گرافیک و WebGL (Renderer)',
      lblCores: 'تعداد هسته‌های پردازنده (CPU Cores)',
      lblMemory: 'میزان حافظه رم (RAM)',
      chkCaptchaSafe: '🛡️ سازگاری کامل با کلودفلر و حل تضمینی کپچا (Cloudflare Turnstile & Captcha Safe)',
      chkCanvasNoise: 'محافظت از بوم (Canvas Noise Protection)',
      chkAudioNoise: 'محافظت از اثرانگشت صوتی (AudioContext Noise)',
      chkWebglNoise: 'شبیه‌سازی بافر WebGL',
      chkWebrtcProtection: 'جلوگیری از افشای IP در WebRTC',
      chkDnsProtection: '🔒 جلوگیری قطعی از نشت DNS (DNS Leak Protection & Secure DoH)',
      secProxy: '۳. تنظیمات پروکسی (اختیاری)',
      chkProxyEnabled: 'استفاده از پروکسی اختصاصی برای این مرورگر',
      lblProxyType: 'نوع پروکسی',
      lblProxyHost: 'آدرس سرور (Host / IP)',
      lblProxyPort: 'پورت (Port)',
      lblProxyUser: 'نام کاربری',
      lblProxyPass: 'کلمه عبور',
      btnTestProxy: '⚡ تست زنده پینگ و اتصال پروکسی',
      noteTitle: 'ایزولاسیون کامل و ماندگاری هوشمند:',
      noteDesc: 'در حالت ذخیره‌سازی پایدار، تمامی لاگین‌ها، کوکی‌ها و تاریخچه‌های شما در پوشه امن اختصاصی ذخیره می‌مانند تا هر زمان مایل بودید با دکمه «🧹 پاک‌سازی» ریست شوند. در صورت خاموش بودن تیک، داده‌ها به محض بستن مرورگر حذف خواهند شد.'
    }
  };

  function t(k, vars) {
    var dict = I18N[currentLang] || I18N.fa;
    var str = dict[k] || I18N.fa[k] || k;
    if (vars && typeof vars === 'object') {
      for (var p in vars) {
        str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), vars[p]);
      }
    }
    return str;
  }

  var state = {
    profiles: [],
    chromium: { found: false, path: null, isDownloadedChromium: false, isEdge: false },
    activeIds: [],
    activeCounts: {},
    query: '',
    selectedTag: null,
    editingId: null,
    downloading: false,
    launching: {},
    stopping: {}
  };

  function $(id) { return document.getElementById(id); }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (typeof text === 'string') n.textContent = text;
    return n;
  }

  function api() {
    if (!window.api) {
      toast('خارج از محیط Electron اجرا شده است.', 'error');
      return null;
    }
    return window.api;
  }

  function errMsg(err) {
    if (!err) return 'خطای ناشناخته';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    try { return JSON.stringify(err); } catch (_) { return 'خطای ناشناخته'; }
  }

  /* ---------- Persian Date & Digits ---------- */

  var faFormatter = null;
  var faDateOnly = null;
  try {
    faFormatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    faDateOnly = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (_) { faFormatter = null; }

  function toDigits(s) {
    if (currentLang === 'en') return String(s);
    var fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(s).replace(/[0-9]/g, function (d) { return fa[+d]; });
  }
  var toFaDigits = toDigits;

  function formatFaDate(ts) {
    if (!ts) return t('neverLaunched');
    try {
      var d = new Date(ts);
      if (isNaN(d.getTime())) return t('neverLaunched');
      if (currentLang === 'en') return d.toLocaleString('en-US');
      if (faFormatter) return faFormatter.format(d);
      return toDigits(d.toLocaleString());
    } catch (_) { return t('neverLaunched'); }
  }

  function formatFaDateShort(ts) {
    if (!ts) return t('neverLaunched');
    try {
      var d = new Date(ts);
      if (isNaN(d.getTime())) return t('neverLaunched');
      if (currentLang === 'en') return d.toLocaleDateString('en-US');
      if (faDateOnly) return faDateOnly.format(d);
      return toDigits(d.toLocaleDateString());
    } catch (_) { return t('neverLaunched'); }
  }

  function timeAgoFa(ts) {
    if (!ts) return t('neverLaunched');
    var diff = Date.now() - ts;
    if (diff < 0) diff = 0;
    var min = Math.floor(diff / 60000);
    if (currentLang === 'en') {
      if (min < 1) return 'Just now';
      if (min < 60) return min + ' mins ago';
      var h = Math.floor(min / 60);
      if (h < 24) return h + ' hrs ago';
      var days = Math.floor(h / 24);
      if (days < 30) return days + ' days ago';
      return formatFaDateShort(ts);
    }
    if (min < 1) return 'لحظاتی پیش';
    if (min < 60) return toDigits(min) + ' دقیقه پیش';
    var h = Math.floor(min / 60);
    if (h < 24) return toDigits(h) + ' ساعت پیش';
    var days = Math.floor(h / 24);
    if (days < 30) return toDigits(days) + ' روز پیش';
    return formatFaDateShort(ts);
  }

  /* ---------- Toast ---------- */

  function toast(message, type) {
    var container = $('toastContainer');
    if (!container) return;
    var t = el('div', 'toast toast-' + (type || 'info'));
    t.appendChild(el('span', 'toast-dot'));
    t.appendChild(el('span', 'toast-msg', String(message || '')));
    var close = el('button', 'toast-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'بستن');
    close.addEventListener('click', function () { t.remove(); });
    t.appendChild(close);
    container.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 300);
    }, 4000);
  }

  /* ---------- Modal Helpers ---------- */

  function showOverlay(overlay) {
    if (overlay) overlay.hidden = false;
  }

  function hideOverlay(overlay) {
    if (overlay) overlay.hidden = true;
  }

  function openConfirm(opts) {
    opts = opts || {};
    var overlay = $('confirmModal');
    var titleEl = $('confirmTitle');
    var msgEl = $('confirmMessage');
    var yesBtn = $('btnConfirmOk');
    var noBtn = $('btnConfirmCancel');

    var closeBtn = $('confirmModalClose');

    if (!overlay || !yesBtn || !noBtn) {
      var ok = window.confirm((opts.title || '') + '\n' + (opts.message || ''));
      return Promise.resolve({ confirmed: ok });
    }

    titleEl.textContent = opts.title || t('confirm');
    msgEl.textContent = opts.message || '';
    yesBtn.textContent = opts.confirmText || t('confirm');
    noBtn.textContent = opts.cancelText || t('cancel');
    yesBtn.classList.toggle('btn-danger', opts.danger !== false);
    yesBtn.classList.toggle('btn-primary', opts.danger === false);

    showOverlay(overlay);
    setTimeout(function () { try { yesBtn.focus(); } catch (_) {} }, 30);

    return new Promise(function (resolve) {
      function cleanup(result) {
        hideOverlay(overlay);
        yesBtn.removeEventListener('click', onYes);
        noBtn.removeEventListener('click', onNo);
        if (closeBtn) closeBtn.removeEventListener('click', onNo);
        overlay.removeEventListener('click', onOverlay);
        document.removeEventListener('keydown', onKey);
        resolve(result);
      }
      function onYes() { cleanup({ confirmed: true }); }
      function onNo() { cleanup({ confirmed: false }); }
      function onOverlay(e) { if (e.target === overlay) cleanup({ confirmed: false }); }
      function onKey(e) { if (e.key === 'Escape') cleanup({ confirmed: false }); }

      yesBtn.addEventListener('click', onYes);
      noBtn.addEventListener('click', onNo);
      if (closeBtn) closeBtn.addEventListener('click', onNo);
      overlay.addEventListener('click', onOverlay);
      document.addEventListener('keydown', onKey);
    });
  }

  /* ---------- Profile Modal ---------- */

  function selectedColor() {
    var checked = document.querySelector('input[name="color"]:checked');
    return checked ? checked.value : COLORS[0];
  }

  function setSelectedColor(color) {
    var radios = document.querySelectorAll('input[name="color"]');
    var matched = false;
    radios.forEach(function (r) {
      var on = r.value === color;
      r.checked = on;
      if (on) matched = true;
    });
    if (!matched && radios.length) radios[0].checked = true;
  }

  function handleAutoDetectIp() {
    var a = api();
    if (!a || !a.detectIpInfo) return;
    var btn = $('btnAutoDetectIp');
    if (btn) { btn.disabled = true; btn.textContent = 'در حال استعلام…'; }

    a.detectIpInfo()
      .then(function (res) {
        if (btn) { btn.disabled = false; btn.textContent = '⚡ تنظیم خودکار با آی‌پی'; }
        if (!res || !res.ok) {
          toast('خطا در دریافت اطلاعات آی‌پی: ' + ((res && res.error) || 'ناموفق'), 'error');
          return;
        }
        if (res.timezone) {
          var tzSelect = $('fpTimezone');
          var exists = false;
          for (var i = 0; i < tzSelect.options.length; i++) {
            if (tzSelect.options[i].value === res.timezone) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            var opt = document.createElement('option');
            opt.value = res.timezone;
            opt.textContent = res.timezone + ' (' + (res.city || res.country || '') + ')';
            tzSelect.appendChild(opt);
          }
          tzSelect.value = res.timezone;
        }
        if (res.countryCode) {
          var langSelect = $('fpLanguage');
          if (res.countryCode === 'TR') langSelect.value = 'tr-TR';
          else if (res.countryCode === 'IR') langSelect.value = 'fa-IR';
          else if (res.countryCode === 'DE') langSelect.value = 'de-DE';
          else if (res.countryCode === 'FR') langSelect.value = 'fr-FR';
          else langSelect.value = 'en-US';
        }
        toast('منطقه زمانی با آی‌پی (' + res.ip + ' - ' + (res.city || '') + ' ' + (res.country || '') + ') هماهنگ شد.', 'success');
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = '⚡ تنظیم خودکار با آی‌پی'; }
        toast('خطا در ارتباط با سرور استعلام آی‌پی: ' + errMsg(err), 'error');
      });
  }

  function randomizeFormFingerprint() {
    var osList = ['windows', 'windows', 'mac', 'linux'];
    var os = osList[Math.floor(Math.random() * osList.length)];
    $('fpOs').value = os;

    var resList = ['1920x1080', '1920x1080', '1536x864', '1440x900', '2560x1440'];
    $('fpResolution').value = resList[Math.floor(Math.random() * resList.length)];

    if (os === 'mac') {
      var macGpus = ['apple-m3-max', 'apple-m3', 'apple-m2-pro', 'apple-m1'];
      $('fpGpu').value = macGpus[Math.floor(Math.random() * macGpus.length)];
    } else if (os === 'linux') {
      var linuxGpus = ['intel-iris-xe', 'intel-arc-a750', 'amd-rx7800', 'amd-rx6600', 'nvidia-rtx3060'];
      $('fpGpu').value = linuxGpus[Math.floor(Math.random() * linuxGpus.length)];
    } else {
      var winGpus = [
        'nvidia-rtx4090', 'nvidia-rtx4080', 'nvidia-rtx4070', 'nvidia-rtx4060ti',
        'nvidia-rtx3080', 'nvidia-rtx3070', 'nvidia-rtx3060', 'nvidia-rtx3050-lap', 'nvidia-gtx1660s',
        'amd-rx7900xtx', 'amd-rx7800', 'amd-rx6700xt', 'amd-rx6600',
        'intel-arc-a770', 'intel-arc-a750', 'intel-iris-xe', 'intel-uhd-770'
      ];
      $('fpGpu').value = winGpus[Math.floor(Math.random() * winGpus.length)];
    }

    var cores = ['4', '6', '8', '8', '12', '16'];
    $('fpCores').value = cores[Math.floor(Math.random() * cores.length)];

    var mems = ['8', '8', '16', '16', '32'];
    $('fpMemory').value = mems[Math.floor(Math.random() * mems.length)];

    var tzList = ['Europe/Istanbul', 'Europe/Berlin', 'Europe/London', 'Europe/Paris', 'Europe/Amsterdam', 'America/New_York', 'Asia/Tehran'];
    $('fpTimezone').value = tzList[Math.floor(Math.random() * tzList.length)];
    $('fpLanguage').value = $('fpTimezone').value === 'Europe/Istanbul' ? 'tr-TR' : 'en-US';

    $('fpCaptchaSafe').checked = true;
    $('fpCanvasNoise').checked = true;
    $('fpAudioNoise').checked = true;
    $('fpWebglNoise').checked = true;
    $('fpWebrtcProtection').checked = true;
    if ($('fpDnsProtection')) $('fpDnsProtection').checked = true;

    toast('هویت دیجیتال تصادفی تنظیم شد.', 'info');
  }

  function openProfileModal(mode, profile) {
    var overlay = $('profileModal');
    if (!overlay) return;
    var titleEl = $('profileModalTitle');
    var nameInput = $('profileName');
    var urlInput = $('startupUrl');
    var saveBtn = $('btnSaveProfile');
    var hiddenId = $('editingProfileId');

    state.editingId = mode === 'edit' && profile ? profile.id : null;
    if (hiddenId) hiddenId.value = state.editingId || '';
    if (titleEl) titleEl.textContent = mode === 'edit' ? t('editTitle') : t('createTitle');
    if (saveBtn) saveBtn.textContent = mode === 'edit' ? t('saveEdit') : t('saveCreate');

    var deleteModalBtn = $('btnDeleteProfileModal');
    if (deleteModalBtn) {
      if (mode === 'edit' && profile) {
        deleteModalBtn.hidden = false;
        deleteModalBtn.textContent = t('deleteProfileBtn');
        deleteModalBtn.onclick = function () {
          closeProfileModal();
          handleDelete(profile.id);
        };
      } else {
        deleteModalBtn.hidden = true;
        deleteModalBtn.onclick = null;
      }
    }

    if (nameInput) {
      nameInput.value = profile ? (profile.name || '') : '';
      updateCharCount();
    }
    if (urlInput) urlInput.value = profile ? (profile.startupUrl || '') : '';
    setSelectedColor((profile && profile.color) || COLORS[Math.floor(Math.random() * COLORS.length)]);

    // Persistence, tags & notes
    var saveCheck = $('profileSaveData');
    if (saveCheck) saveCheck.checked = profile ? (profile.saveData !== false) : true;
    var tagsInput = $('profileTags');
    if (tagsInput) tagsInput.value = (profile && Array.isArray(profile.tags)) ? profile.tags.join('، ') : '';
    var notesInput = $('profileNotes');
    if (notesInput) notesInput.value = (profile && profile.notes) || '';
    var proxyTestBadge = $('proxyTestResult');
    if (proxyTestBadge) {
      proxyTestBadge.hidden = true;
      proxyTestBadge.className = 'proxy-test-badge';
      proxyTestBadge.textContent = '';
    }

    // Fingerprint fields
    var fp = (profile && profile.fingerprint) || {};
    $('fpOs').value = fp.os || 'windows';
    var curRes = (fp.screenWidth && fp.screenHeight) ? (fp.screenWidth + 'x' + fp.screenHeight) : '1920x1080';
    $('fpResolution').value = $('fpResolution').querySelector('option[value="' + curRes + '"]') ? curRes : '1920x1080';

    var curGpuKey = 'nvidia-rtx4070';
    for (var k in GPU_MAP) {
      if (GPU_MAP[k].vendor === fp.webglVendor || GPU_MAP[k].name === fp.webglGpuName) {
        curGpuKey = k;
        break;
      }
    }
    $('fpGpu').value = curGpuKey;
    $('fpCores').value = String(fp.hardwareConcurrency || 8);
    $('fpMemory').value = String(fp.deviceMemory || 8);
    $('fpTimezone').value = fp.timezone || 'America/New_York';
    $('fpLanguage').value = fp.language || 'en-US';
    if ($('fpCaptchaSafe')) $('fpCaptchaSafe').checked = fp.captchaSafe !== false;
    $('fpCanvasNoise').checked = fp.canvasNoise !== false;
    $('fpAudioNoise').checked = fp.audioNoise !== false;
    $('fpWebglNoise').checked = fp.webglNoise !== false;
    $('fpWebrtcProtection').checked = fp.webrtcPolicy !== 'default';
    if ($('fpDnsProtection')) $('fpDnsProtection').checked = fp.dnsProtection !== false;

    // Proxy fields
    var pxy = (profile && profile.proxy) || {};
    var proxyEnabled = $('proxyEnabled');
    var proxyWrap = $('proxyFieldsWrap');
    proxyEnabled.checked = !!pxy.enabled;
    proxyWrap.hidden = !pxy.enabled;
    $('proxyType').value = pxy.type || 'http';
    $('proxyHost').value = pxy.host || '';
    $('proxyPort').value = pxy.port ? String(pxy.port) : '';
    $('proxyUser').value = pxy.username || '';
    $('proxyPass').value = pxy.password || '';

    showOverlay(overlay);
    setTimeout(function () {
      try {
        if (nameInput) { nameInput.focus(); nameInput.select(); }
      } catch (_) {}
    }, 40);
  }

  function closeProfileModal() {
    var overlay = $('profileModal');
    if (overlay) hideOverlay(overlay);
    state.editingId = null;
  }

  function updateCharCount() {
    var nameInput = $('profileName');
    var counter = $('nameCounter');
    if (!nameInput || !counter) return;
    counter.textContent = toFaDigits(String(nameInput.value.length)) + ' / ' + toFaDigits(60);
  }

  function normalizeStartupUrl(raw) {
    var u = String(raw || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  }

  function saveProfileFromModal() {
    var a = api();
    if (!a) return;
    var nameInput = $('profileName');
    var urlInput = $('startupUrl');
    var saveBtn = $('btnSaveProfile');
    var name = nameInput ? nameInput.value.trim() : '';
    var startupUrl = urlInput ? normalizeStartupUrl(urlInput.value) : '';

    if (!name) {
      toast(currentLang === 'en' ? 'Please enter profile name.' : 'نام مرورگر را وارد کنید.', 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (startupUrl) {
      try {
        var parsed = new URL(startupUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          toast(currentLang === 'en' ? 'Startup URL must start with http:// or https://' : 'آدرس شروع باید با http یا https باشد.', 'error');
          return;
        }
      } catch (_) {
        toast(currentLang === 'en' ? 'Invalid startup URL.' : 'آدرس شروع معتبر نیست.', 'error');
        return;
      }
    }

    // Proxy extraction
    var proxyObj = null;
    var proxyEnabled = $('proxyEnabled').checked;
    if (proxyEnabled) {
      var host = $('proxyHost').value.trim();
      var portStr = $('proxyPort').value.trim();
      var port = parseInt(portStr, 10);
      if (!host) {
        toast(currentLang === 'en' ? 'Please enter proxy host.' : 'آدرس هاست پروکسی را وارد کنید.', 'error');
        $('proxyHost').focus();
        return;
      }
      if (isNaN(port) || port < 1 || port > 65535) {
        toast(currentLang === 'en' ? 'Proxy port must be between 1 and 65535.' : 'پورت پروکسی باید عددی بین ۱ تا ۶۵۵۳۵ باشد.', 'error');
        $('proxyPort').focus();
        return;
      }
      proxyObj = {
        enabled: true,
        type: $('proxyType').value,
        host: host,
        port: port,
        username: $('proxyUser').value.trim(),
        password: $('proxyPass').value.trim()
      };
    }

    // Fingerprint extraction
    var resParts = ($('fpResolution').value || '1920x1080').split('x');
    var screenWidth = parseInt(resParts[0], 10) || 1920;
    var screenHeight = parseInt(resParts[1], 10) || 1080;
    var gpuKey = $('fpGpu').value || 'nvidia-rtx4070';
    var gpuInfo = GPU_MAP[gpuKey] || GPU_MAP['nvidia-rtx4070'];
    var os = $('fpOs').value || 'windows';

    var platform = 'Win32';
    var userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';
    if (os === 'mac') {
      platform = 'MacIntel';
      userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';
    } else if (os === 'linux') {
      platform = 'Linux x86_64';
      userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';
    }

    var timezone = $('fpTimezone').value || 'America/New_York';
    var language = $('fpLanguage').value || 'en-US';
    var captchaSafe = $('fpCaptchaSafe') ? $('fpCaptchaSafe').checked : true;

    var fingerprintObj = {
      os: os,
      platform: platform,
      userAgent: userAgent,
      screenWidth: screenWidth,
      screenHeight: screenHeight,
      webglVendor: gpuInfo.vendor,
      webglRenderer: gpuInfo.renderer,
      webglGpuName: gpuInfo.name,
      hardwareConcurrency: parseInt($('fpCores').value, 10) || 8,
      deviceMemory: parseInt($('fpMemory').value, 10) || 8,
      canvasNoise: $('fpCanvasNoise').checked,
      audioNoise: $('fpAudioNoise').checked,
      webglNoise: $('fpWebglNoise').checked,
      captchaSafe: captchaSafe,
      webrtcPolicy: $('fpWebrtcProtection').checked ? 'disable_non_proxied_udp' : 'default',
      dnsProtection: $('fpDnsProtection') ? $('fpDnsProtection').checked : true,
      timezone: timezone,
      language: language,
      seed: Math.floor(Math.random() * 900000) + 100000
    };

    var saveData = $('profileSaveData') ? $('profileSaveData').checked : true;
    var tagsRaw = $('profileTags') ? $('profileTags').value : '';
    var tags = tagsRaw.split(/[,،]/).map(function (t) { return t.trim(); }).filter(Boolean);
    var notes = $('profileNotes') ? $('profileNotes').value.trim() : '';

    var payload = {
      name: name,
      color: selectedColor(),
      startupUrl: startupUrl,
      saveData: saveData,
      tags: tags,
      notes: notes,
      proxy: proxyObj,
      fingerprint: fingerprintObj
    };

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'در حال ذخیره…'; }
    var done = function () {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = state.editingId ? t('saveEdit') : t('saveCreate');
      }
    };

    if (state.editingId) {
      a.updateProfile(state.editingId, payload)
        .then(function (updated) {
          done();
          if (!updated) {
            toast('مرورگر پیدا نشد.', 'error');
            return loadProfiles();
          }
          closeProfileModal();
          toast('تغییرات با موفقیت ذخیره شد.', 'success');
          return loadProfiles();
        })
        .catch(function (err) {
          done();
          toast('خطا در ذخیره تغییرات: ' + errMsg(err), 'error');
        });
    } else {
      a.createProfile(payload)
        .then(function (created) {
          done();
          if (!created) {
            toast('ساخت مرورگر ناموفق بود.', 'error');
            return;
          }
          closeProfileModal();
          toast('مرورگر جدید با هویت اختصاصی ساخته شد.', 'success');
          return loadProfiles();
        })
        .catch(function (err) {
          done();
          toast('خطا در ساخت مرورگر: ' + errMsg(err), 'error');
        });
    }
  }

  /* ---------- Data Loading ---------- */

  function loadProfiles() {
    var a = api();
    if (!a) return Promise.resolve();
    return a.listProfiles()
      .then(function (list) {
        state.profiles = Array.isArray(list) ? list : [];
        renderTagsFilterBar();
        return refreshActiveWindows().then(renderProfiles);
      })
      .catch(function (err) {
        toast('خطا در بارگذاری فهرست: ' + errMsg(err), 'error');
        state.profiles = [];
        renderTagsFilterBar();
        renderProfiles();
      });
  }

  function refreshActiveWindows() {
    var a = api();
    if (!a) return Promise.resolve();
    return a.getRunning()
      .then(function (res) {
        state.activeIds = (res && Array.isArray(res.running)) ? res.running : [];
        state.activeCounts = (res && res.counts) || {};
      })
      .catch(function () {
        state.activeIds = [];
        state.activeCounts = {};
      });
  }

  function refreshChromiumStatus() {
    var a = api();
    if (!a) return Promise.resolve();
    return a.getChromiumStatus()
      .then(function (s) {
        state.chromium = s || { found: false };
        renderChromiumStatus();
      })
      .catch(function () {
        state.chromium = { found: false };
        renderChromiumStatus();
      });
  }

  /* ---------- Rendering ---------- */

  function filteredProfiles() {
    var q = state.query.trim().toLowerCase();
    var selTag = state.selectedTag;
    return state.profiles.filter(function (p) {
      if (selTag) {
        if (!Array.isArray(p.tags) || p.tags.indexOf(selTag) === -1) {
          return false;
        }
      }
      if (!q) return true;
      var matchName = String(p.name || '').toLowerCase().includes(q);
      var matchGpu = p.fingerprint && String(p.fingerprint.webglGpuName || '').toLowerCase().includes(q);
      var matchOs = p.fingerprint && String(p.fingerprint.os || '').toLowerCase().includes(q);
      var matchTags = Array.isArray(p.tags) && p.tags.some(function (t) { return String(t || '').toLowerCase().includes(q); });
      var matchNotes = String(p.notes || '').toLowerCase().includes(q);
      return matchName || matchGpu || matchOs || matchTags || matchNotes;
    });
  }

  function renderTagsFilterBar() {
    var bar = $('tagsFilterBar');
    var listEl = $('tagsFilterList');
    if (!bar || !listEl) return;

    var tagCounts = {};
    state.profiles.forEach(function (p) {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(function (t) {
          var trimmed = String(t || '').trim();
          if (trimmed) tagCounts[trimmed] = (tagCounts[trimmed] || 0) + 1;
        });
      }
    });

    var tags = Object.keys(tagCounts).sort();
    if (tags.length === 0) {
      bar.hidden = true;
      listEl.innerHTML = '';
      state.selectedTag = null;
      return;
    }

    bar.hidden = false;
    listEl.innerHTML = '';

    var allBtn = el('button', 'tag-filter-btn' + (!state.selectedTag ? ' active' : ''), t('all') + ' (' + toDigits(state.profiles.length) + ')');
    allBtn.type = 'button';
    allBtn.addEventListener('click', function () {
      state.selectedTag = null;
      renderTagsFilterBar();
      renderProfiles();
    });
    listEl.appendChild(allBtn);

    tags.forEach(function (tag) {
      var isActive = state.selectedTag === tag;
      var btn = el('button', 'tag-filter-btn' + (isActive ? ' active' : ''), '#' + tag + ' (' + toDigits(tagCounts[tag]) + ')');
      btn.type = 'button';
      btn.addEventListener('click', function () {
        state.selectedTag = isActive ? null : tag;
        renderTagsFilterBar();
        renderProfiles();
      });
      listEl.appendChild(btn);
    });
  }

  function buildNewCard() {
    var card = el('button', 'card new-card');
    card.type = 'button';
    card.title = t('newCardTitle');
    card.appendChild(el('span', 'new-plus', '＋'));
    card.appendChild(el('span', 'new-title', t('newCardTitle')));
    card.appendChild(el('span', 'new-desc', t('newCardDesc')));
    card.addEventListener('click', function () { openProfileModal('create', null); });
    return card;
  }

  function buildProfileCard(p) {
    var tpl = $('profileCardTemplate');
    var card;
    if (tpl && tpl.content && tpl.content.firstElementChild) {
      card = tpl.content.firstElementChild.cloneNode(true);
    } else {
      card = el('article', 'card profile-card');
    }
    card.setAttribute('data-id', p.id);

    var dot = card.querySelector('.color-dot');
    if (dot) dot.style.background = p.color || '#4f8cff';
    var nameEl = card.querySelector('.profile-name');
    if (nameEl) { nameEl.textContent = p.name || 'بدون نام'; nameEl.title = p.name || ''; }

    var isRunning = state.activeIds.indexOf(p.id) !== -1;
    var badge = card.querySelector('[data-active-badge]');
    if (badge) {
      badge.hidden = !isRunning;
      var count = state.activeCounts[p.id] || 1;
      badge.textContent = count > 1 ? ('● فعال (' + toFaDigits(count) + ')') : '● فعال';
    }

    // Tags
    var tagsContainer = card.querySelector('[data-card-tags]');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
      if (Array.isArray(p.tags) && p.tags.length > 0) {
        tagsContainer.hidden = false;
        p.tags.forEach(function (tag) {
          var tPill = el('span', 'tag-pill', '#' + tag);
          tPill.addEventListener('click', function (e) {
            e.stopPropagation();
            state.selectedTag = (state.selectedTag === tag) ? null : tag;
            renderTagsFilterBar();
            renderProfiles();
          });
          tagsContainer.appendChild(tPill);
        });
      } else {
        tagsContainer.hidden = true;
      }
    }

    // Chips
    var fp = p.fingerprint || {};
    var osChip = card.querySelector('[data-chip="os"]');
    if (osChip) {
      var osFa = fp.os === 'mac' ? '💻 macOS' : (fp.os === 'linux' ? '💻 Linux' : (currentLang === 'en' ? '💻 Windows 11' : '💻 ویندوز ۱۱'));
      osChip.textContent = osFa;
    }

    var tzChip = card.querySelector('[data-chip="tz"]');
    if (tzChip) {
      var tzName = fp.timezone || 'Europe/Berlin';
      var shortTz = tzName.replace(/^.*\//, '');
      tzChip.textContent = '🌍 ' + shortTz;
      tzChip.title = tzName;
    }

    var gpuChip = card.querySelector('[data-chip="gpu"]');
    if (gpuChip) {
      var gName = fp.webglGpuName || 'RTX 4070';
      gpuChip.textContent = '🎮 ' + gName;
      gpuChip.title = fp.webglRenderer || gName;
    }

    var hwChip = card.querySelector('[data-chip="hw"]');
    if (hwChip) {
      var cores = fp.hardwareConcurrency || 8;
      var ram = fp.deviceMemory || 8;
      hwChip.textContent = '⚡ ' + toDigits(cores) + ' ' + (currentLang === 'en' ? 'Cores' : 'هسته') + ' / ' + toDigits(ram) + 'GB';
    }

    var modeChip = card.querySelector('[data-chip="mode"]');
    if (modeChip) {
      var isPersist = p.saveData !== false;
      modeChip.textContent = isPersist ? t('persistentChip') : t('ephemeralChip');
      modeChip.className = 'chip chip-mode ' + (isPersist ? 'chip-persistent' : 'chip-ephemeral');
    }

    var proxyChip = card.querySelector('[data-chip="proxy"]');
    if (proxyChip) {
      if (p.proxy && p.proxy.enabled && p.proxy.host) {
        proxyChip.hidden = false;
        proxyChip.textContent = (currentLang === 'en' ? '🌐 Proxy: ' : '🌐 پروکسی: ') + p.proxy.host + ':' + p.proxy.port;
      } else {
        proxyChip.hidden = true;
      }
    }

    var notesEl = card.querySelector('[data-card-notes]');
    if (notesEl) {
      if (p.notes && p.notes.trim()) {
        notesEl.hidden = false;
        notesEl.textContent = '📝 ' + p.notes.trim();
        notesEl.title = p.notes.trim();
      } else {
        notesEl.hidden = true;
      }
    }

    var urlEl = card.querySelector('.startup-url');
    if (urlEl) {
      if (p.startupUrl) {
        urlEl.textContent = p.startupUrl;
        urlEl.title = p.startupUrl;
        urlEl.hidden = false;
      } else {
        urlEl.hidden = true;
      }
    }

    var meta = card.querySelector('.last-launched');
    if (meta) {
      meta.textContent = t('lastLaunched') + ': ' + timeAgoFa(p.lastLaunched);
      meta.title = formatFaDate(p.lastLaunched);
    }

    var isLaunching = !!state.launching[p.id];
    var isStopping = !!state.stopping[p.id];

    var launchBtn = card.querySelector('button[data-action="launch"]');
    var stopBtn = card.querySelector('button[data-action="stop"]');

    if (launchBtn && stopBtn) {
      if (isRunning) {
        launchBtn.hidden = true;
        stopBtn.hidden = false;
        stopBtn.disabled = isStopping;
        stopBtn.textContent = isStopping ? t('stopping') : t('stopBtn');
        stopBtn.addEventListener('click', function () { handleStop(p.id); });
      } else {
        stopBtn.hidden = true;
        launchBtn.hidden = false;
        launchBtn.disabled = isLaunching;
        launchBtn.textContent = isLaunching ? t('launching') : t('launchBtn');
        launchBtn.addEventListener('click', function () { handleLaunch(p.id); });
      }
    }

    card.querySelectorAll('button[data-action]').forEach(function (btn) {
      var action = btn.getAttribute('data-action');
      if (action === 'clone') {
        btn.textContent = t('cloneBtn');
        btn.addEventListener('click', function () { handleClone(p.id); });
      } else if (action === 'edit') {
        btn.textContent = t('editBtn');
        btn.addEventListener('click', function () { openProfileModal('edit', p); });
      } else if (action === 'randomize') {
        btn.textContent = t('randomizeBtn');
        btn.addEventListener('click', function () { handleRandomize(p.id); });
      } else if (action === 'wipe') {
        btn.textContent = t('wipeBtn');
        btn.addEventListener('click', function () { handleWipe(p.id); });
      } else if (action === 'delete') {
        if (!btn.classList.contains('card-top-delete')) {
          btn.textContent = t('deleteBtn');
        }
        btn.addEventListener('click', function () { handleDelete(p.id); });
      }
    });

    return card;
  }

  function renderProfiles() {
    var grid = $('profileGrid');
    var empty = $('emptyState');
    var noRes = $('noResults');
    var countEl = $('profilesCount');
    var activeCount = $('activeCount');
    if (!grid) return;

    grid.innerHTML = '';

    var list = filteredProfiles().slice().sort(function (a, b) {
      return (b.lastLaunched || b.createdAt || 0) - (a.lastLaunched || a.createdAt || 0);
    });

    if (countEl) {
      countEl.textContent = state.profiles.length === 0
        ? ''
        : toDigits(state.profiles.length) + ' ' + (currentLang === 'en' ? 'Profiles' : 'مرورگر ثبت‌شده');
    }
    if (activeCount) activeCount.textContent = toDigits(state.activeIds.length);

    var isSearching = state.query.trim().length > 0;

    if (state.profiles.length === 0 && !isSearching) {
      if (empty) empty.hidden = false;
      if (noRes) noRes.hidden = true;
      grid.appendChild(buildNewCard());
      return;
    }
    if (empty) empty.hidden = true;

    if (list.length === 0 && isSearching) {
      if (noRes) noRes.hidden = false;
      return;
    }
    if (noRes) noRes.hidden = true;

    list.forEach(function (p) { grid.appendChild(buildProfileCard(p)); });
    grid.appendChild(buildNewCard());
  }

  /* ---------- Chromium Status + Download ---------- */

  function renderChromiumStatus() {
    var badge = $('chromiumStatus');
    var dlBtn = $('btnDownloadChromium');
    var s = state.chromium || {};
    var pathEl = $('chromiumPath');

    if (pathEl) {
      pathEl.textContent = s.found ? 'jozmoz' : (currentLang === 'en' ? 'Not Found' : 'یافت نشد');
      pathEl.title = 'jozmoz Engine';
    }

    if (badge) {
      badge.classList.remove('status-ok', 'status-warn', 'status-info', 'status-checking');
      if (s.found) {
        badge.classList.add('status-ok');
        badge.textContent = t('engineReady');
        badge.title = 'jozmoz';
      } else {
        badge.classList.add('status-warn');
        badge.textContent = t('engineNotFound');
        badge.title = '';
      }
    }

    if (dlBtn) {
      dlBtn.classList.remove('attention');
      if (state.downloading) {
        dlBtn.disabled = true;
        dlBtn.textContent = '⏳ در حال دانلود…';
      } else if (s.found && s.isDownloadedChromium) {
        dlBtn.disabled = true;
        dlBtn.textContent = '✓ کرومیوم پرتابل آماده است';
      } else if (s.found) {
        dlBtn.disabled = false;
        dlBtn.textContent = '⬇ دانلود کرومیوم داخلی (اختیاری)';
      } else {
        dlBtn.disabled = false;
        dlBtn.classList.add('attention');
        dlBtn.textContent = '⬇ دانلود کرومیوم';
      }
    }

    var banner = $('noBrowserBanner');
    if (banner) banner.hidden = !!s.found;
  }

  function setProgress(percent, label) {
    var wrap = $('downloadBarWrap');
    var bar = $('downloadProgressBar');
    var role = $('downloadProgressRole');
    var lab = $('downloadLabel');
    var pct = $('downloadPercent');
    if (wrap) wrap.hidden = false;
    var p = Math.max(0, Math.min(100, percent));
    if (bar) bar.style.width = p + '%';
    if (role) role.setAttribute('aria-valuenow', String(Math.round(p)));
    if (lab && typeof label === 'string') lab.textContent = label;
    if (pct) pct.textContent = toFaDigits(Math.round(p)) + '٪';
  }

  function hideProgress() {
    var wrap = $('downloadBarWrap');
    if (wrap) wrap.hidden = true;
  }

  function statusTextFor(st) {
    if (!st) return '';
    if (st.status === 'resolving') return 'در حال یافتن آخرین نسخه کرومیوم…';
    if (st.status === 'downloading') return 'در حال دانلود کرومیوم… ' + toFaDigits(st.percent || 0) + '٪';
    if (st.status === 'extracting') return 'در حال استخراج و آماده‌سازی فایل‌ها…';
    return '';
  }

  function handleDownloadChromium() {
    var a = api();
    if (!a || state.downloading) return;
    state.downloading = true;
    renderChromiumStatus();
    setProgress(0, 'شروع دانلود…');
    toast('دانلود نسخه کرومیوم آغاز شد.', 'info');

    var unsub = null;
    try {
      unsub = a.onChromiumProgress(function (st) {
        var pct = st && typeof st.percent === 'number' ? st.percent : 0;
        setProgress(pct, statusTextFor(st));
        if (st && st.status === 'extracting') setProgress(100, statusTextFor(st));
      });
    } catch (_) { unsub = null; }

    a.downloadChromium()
      .then(function (res) {
        state.downloading = false;
        if (typeof unsub === 'function') { try { unsub(); } catch (_) {} }
        if (res && res.ok) {
          setProgress(100, 'دانلود کامل شد.');
          toast('کرومیوم با موفقیت نصب شد.', 'success');
          setTimeout(hideProgress, 2500);
        } else {
          hideProgress();
          toast('دانلود ناموفق بود: ' + errMsg(res && res.error), 'error');
        }
        return refreshChromiumStatus();
      })
      .catch(function (err) {
        state.downloading = false;
        if (typeof unsub === 'function') { try { unsub(); } catch (_) {} }
        hideProgress();
        toast('خطا در دانلود کرومیوم: ' + errMsg(err), 'error');
        renderChromiumStatus();
      });
  }

  /* ---------- Profile Actions ---------- */

  function findProfile(id) {
    for (var i = 0; i < state.profiles.length; i++) {
      if (state.profiles[i].id === id) return state.profiles[i];
    }
    return null;
  }

  function handleLaunch(id) {
    var a = api();
    if (!a || state.launching[id]) return;
    state.launching[id] = true;
    renderProfiles();
    a.launchProfile(id)
      .then(function (res) {
        delete state.launching[id];
        if (res && res.ok) {
          toast('مرورگر با موفقیت در محیط امن و بدون داده اجرا شد.', 'success');
          return loadProfiles();
        }
        if (res && res.error === 'NO_BROWSER') {
          toast('مرورگری یافت نشد. دانلود کرومیوم لازم است.', 'error');
          renderProfiles();
          return refreshChromiumStatus();
        }
        renderProfiles();
        toast('اجرا ناموفق بود: ' + errMsg(res && res.error), 'error');
      })
      .catch(function (err) {
        delete state.launching[id];
        renderProfiles();
        toast('خطا در اجرا: ' + errMsg(err), 'error');
      });
  }

  function handleStop(id) {
    var a = api();
    if (!a || state.stopping[id]) return;
    state.stopping[id] = true;
    renderProfiles();
    a.stopProfile(id)
      .then(function () {
        delete state.stopping[id];
        toast('مرورگر متوقف شد و نشست آن منهدم گردید.', 'info');
        return refreshActiveWindows().then(renderProfiles);
      })
      .catch(function (err) {
        delete state.stopping[id];
        toast('خطا در توقف مرورگر: ' + errMsg(err), 'error');
      });
  }

  function handleRandomize(id) {
    var a = api();
    if (!a) return;
    a.randomizeFingerprint(id)
      .then(function (updated) {
        if (updated) {
          toast('هویت دیجیتال تصادفی جدید با موفقیت اعمال شد.', 'success');
          return loadProfiles();
        }
      })
      .catch(function (err) {
        toast('خطا در تغییر هویت: ' + errMsg(err), 'error');
      });
  }

  function handleWipe(id) {
    var p = findProfile(id);
    var name = p ? p.name : '';
    openConfirm({
      title: t('wipeTitle'),
      message: t('wipeMsg', { name: name }),
      confirmText: t('wipeBtn'),
      danger: true
    }).then(function (r) {
      if (!r.confirmed) return;
      var a = api();
      if (!a) return;
      a.wipeProfile(id)
        .then(function () {
          toast(currentLang === 'en' ? 'Profile data wiped successfully.' : 'تمامی فایل‌ها و نشست‌های مرورگر با موفقیت پاک‌سازی شدند.', 'success');
          return refreshActiveWindows().then(renderProfiles);
        })
        .catch(function (err) {
          toast((currentLang === 'en' ? 'Error wiping data: ' : 'خطا در پاک‌سازی: ') + errMsg(err), 'error');
        });
    });
  }

  function handleWipeAll() {
    openConfirm({
      title: t('wipeAllTitle'),
      message: t('wipeAllMsg'),
      confirmText: t('wipeAllBtn'),
      danger: true
    }).then(function (r) {
      if (!r.confirmed) return;
      var a = api();
      if (!a) return;
      a.wipeAllSessions()
        .then(function () {
          toast(currentLang === 'en' ? 'All sessions and data wiped successfully.' : 'تمامی نشست‌ها متوقف و کلیه داده‌های موقت منهدم گردیدند.', 'success');
          return refreshActiveWindows().then(renderProfiles);
        })
        .catch(function (err) {
          toast((currentLang === 'en' ? 'Error wiping all: ' : 'خطا در پاک‌سازی کلی: ') + errMsg(err), 'error');
        });
    });
  }

  function handleDelete(id) {
    var p = findProfile(id);
    var name = p ? p.name : '';
    openConfirm({
      title: t('deleteTitle'),
      message: t('deleteMsg', { name: name }),
      confirmText: t('deleteBtn'),
      danger: true
    }).then(function (r) {
      if (!r.confirmed) return;
      var a = api();
      if (!a) return;
      a.deleteProfile(id)
        .then(function () {
          toast(currentLang === 'en' ? 'Profile deleted successfully.' : 'مرورگر حذف شد.', 'success');
          return loadProfiles();
        })
        .catch(function (err) {
          toast((currentLang === 'en' ? 'Error deleting profile: ' : 'خطا در حذف: ') + errMsg(err), 'error');
        });
    });
  }

  function handleClone(id) {
    var a = api();
    if (!a || !a.cloneProfile) return;
    a.cloneProfile(id)
      .then(function (cloned) {
        if (cloned) {
          toast('مرورگر با هویت و اثرانگشت تصادفی جدید با موفقیت تکثیر شد.', 'success');
          return loadProfiles();
        }
      })
      .catch(function (err) {
        toast('خطا در تکثیر مرورگر: ' + errMsg(err), 'error');
      });
  }

  function handleTestProxy() {
    var a = api();
    if (!a || !a.testProxy) return;
    var host = $('proxyHost').value.trim();
    var port = parseInt($('proxyPort').value.trim(), 10);
    var badge = $('proxyTestResult');
    var btn = $('btnTestProxy');

    if (!host || isNaN(port)) {
      toast('ابتدا آدرس سرور (هاست) و پورت پروکسی را وارد کنید.', 'error');
      return;
    }

    var proxyObj = {
      type: $('proxyType').value,
      host: host,
      port: port,
      username: $('proxyUser').value.trim(),
      password: $('proxyPass').value.trim()
    };

    if (btn) { btn.disabled = true; btn.textContent = '⏳ در حال تست پینگ…'; }
    if (badge) {
      badge.hidden = false;
      badge.className = 'proxy-test-badge checking';
      badge.textContent = 'در حال تست پینگ…';
    }

    a.testProxy(proxyObj)
      .then(function (res) {
        if (btn) { btn.disabled = false; btn.textContent = '⚡ تست زنده پینگ و اتصال پروکسی'; }
        if (!badge) return;
        if (res && res.ok) {
          badge.className = 'proxy-test-badge success';
          var txt = '✓ متصل (' + toFaDigits(res.latencyMs || 0) + 'ms)';
          if (res.country) txt += ' • ' + res.country;
          badge.textContent = txt;
          toast('پروکسی فعال است (' + (res.latencyMs || 0) + 'ms).', 'success');
        } else {
          badge.className = 'proxy-test-badge error';
          badge.textContent = '✕ ناموفق (' + (res && res.error ? res.error : 'عدم پاسخ') + ')';
          toast('اتصال به پروکسی ناموفق بود: ' + (res && res.error ? res.error : 'تایم‌اوت'), 'error');
        }
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = '⚡ تست زنده پینگ و اتصال پروکسی'; }
        if (badge) {
          badge.className = 'proxy-test-badge error';
          badge.textContent = '✕ خطای شبکه';
        }
        toast('خطا در بررسی پروکسی: ' + errMsg(err), 'error');
      });
  }

  function handleOpenDataFolder() {
    var a = api();
    if (!a) return;
    try {
      a.openDataFolder();
    } catch (err) {
      toast('خطا در باز کردن پوشه: ' + errMsg(err), 'error');
    }
  }

  /* ---------- Events & Setup ---------- */

  /* ---------- Internationalization (i18n) ---------- */

  function applyLanguage(lang) {
    currentLang = lang || 'en';
    localStorage.setItem('app_lang', currentLang);
    document.documentElement.dir = (currentLang === 'fa' ? 'rtl' : 'ltr');
    document.documentElement.lang = currentLang;

    var btnToggle = $('btnLangToggle');
    if (btnToggle) btnToggle.textContent = (currentLang === 'fa' ? '🌐 English' : '🌐 فارسی');

    // Dynamic data-i18n translation
    var translatables = document.querySelectorAll('[data-i18n]');
    translatables.forEach(function (node) {
      var k = node.getAttribute('data-i18n');
      var val = t(k);
      if (!val) return;
      if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
        if (node.hasAttribute('placeholder')) node.placeholder = val;
      } else {
        node.textContent = val;
      }
    });

    var gpuSel = $('fpGpu');
    if (gpuSel) {
      var groups = gpuSel.querySelectorAll('optgroup');
      groups.forEach(function (g) {
        var grp = g.getAttribute('data-group');
        if (grp === 'nvidia') g.label = currentLang === 'en' ? 'NVIDIA GeForce (RTX 40 & 30 Series)' : 'NVIDIA GeForce (سری ۴۰ و ۳۰)';
        else if (grp === 'amd') g.label = currentLang === 'en' ? 'AMD Radeon (RX 7000 & 6000 Series)' : 'AMD Radeon (سری RX 7000 و 6000)';
        else if (grp === 'intel') g.label = currentLang === 'en' ? 'Intel Graphics (Arc, Iris, UHD)' : 'Intel Graphics (Arc & Iris & UHD)';
        else if (grp === 'apple') g.label = currentLang === 'en' ? 'Apple Silicon (M3, M2, M1)' : 'Apple Silicon (macOS)';
      });
    }

    renderChromiumStatus();
    renderTagsFilterBar();
    renderProfiles();
  }

  function toggleLanguage() {
    applyLanguage(currentLang === 'fa' ? 'en' : 'fa');
  }

  function bindEvents() {
    var form = $('profileForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveProfileFromModal();
      });
    }

    var btnLang = $('btnLangToggle');
    if (btnLang) btnLang.addEventListener('click', toggleLanguage);

    var btnCancel = $('btnCancelProfile');
    if (btnCancel) btnCancel.addEventListener('click', closeProfileModal);

    var modalClose = $('profileModalClose');
    if (modalClose) modalClose.addEventListener('click', closeProfileModal);

    var profileOverlay = $('profileModal');
    if (profileOverlay) {
      profileOverlay.addEventListener('click', function (e) {
        if (e.target === profileOverlay) closeProfileModal();
      });
    }

    var btnRandom = $('btnSmartRandomize');
    if (btnRandom) btnRandom.addEventListener('click', randomizeFormFingerprint);

    var btnAutoIp = $('btnAutoDetectIp');
    if (btnAutoIp) btnAutoIp.addEventListener('click', handleAutoDetectIp);

    var proxyCheck = $('proxyEnabled');
    var proxyWrap = $('proxyFieldsWrap');
    if (proxyCheck && proxyWrap) {
      proxyCheck.addEventListener('change', function () {
        proxyWrap.hidden = !proxyCheck.checked;
      });
    }

    var nameInput = $('profileName');
    if (nameInput) nameInput.addEventListener('input', updateCharCount);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeProfileModal();
    });

    var btnEmpty = $('btnEmptyNew');
    if (btnEmpty) btnEmpty.addEventListener('click', function () { openProfileModal('create', null); });

    var btnNewCard = $('newProfileCard');
    if (btnNewCard) btnNewCard.addEventListener('click', function () { openProfileModal('create', null); });

    var btnTestProxy = $('btnTestProxy');
    if (btnTestProxy) btnTestProxy.addEventListener('click', handleTestProxy);

    var btnData = $('btnDataFolder');
    if (btnData) btnData.addEventListener('click', handleOpenDataFolder);

    var btnWipeAll = $('btnWipeAll');
    if (btnWipeAll) btnWipeAll.addEventListener('click', handleWipeAll);

    var btnDl = $('btnDownloadChromium');
    if (btnDl) btnDl.addEventListener('click', handleDownloadChromium);

    var btnBannerDl = $('btnBannerDownload');
    if (btnBannerDl) btnBannerDl.addEventListener('click', handleDownloadChromium);

    var btnBannerX = $('btnBannerDismiss');
    if (btnBannerX) btnBannerX.addEventListener('click', function () {
      var banner = $('noBrowserBanner');
      if (banner) banner.hidden = true;
    });

    var search = $('searchInput');
    if (search) {
      search.addEventListener('input', function () {
        state.query = search.value || '';
        renderProfiles();
      });
    }

    // Live reactive listener for browser process status
    var a = api();
    if (a && typeof a.onBrowserStatus === 'function') {
      try {
        a.onBrowserStatus(function (snapshot) {
          if (snapshot && Array.isArray(snapshot.running)) {
            state.activeIds = snapshot.running;
            state.activeCounts = snapshot.counts || {};
            renderProfiles();
          }
        });
      } catch (_) {}
    }
  }

  function init() {
    bindEvents();
    applyLanguage(currentLang);
    updateCharCount();
    hideProgress();
    loadProfiles();
    refreshChromiumStatus();
    setInterval(function () { refreshChromiumStatus(); }, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

