(() => {
  'use strict';

  const STORAGE_KEY = 'cartlog.switch.v1';
  const META_KEY = 'cartlog.switch.meta.v1';
  const APP_ID = 'cart-log';
  const APP_VERSION = 5;

  const PLATFORMS = ['淘宝', '闲鱼', '拼多多', '京东', 'eShop', '线下店', '朋友转让', '海淘 / 代购', '其他'];
  const PLATFORM_COLORS = {
    '淘宝': '#ff6a00',
    '闲鱼': '#e0aa00',
    '拼多多': '#e02e24',
    '京东': '#c81623',
    'eShop': '#e60012',
    '线下店': '#2f7d5d',
    '朋友转让': '#5a79b8',
    '海淘 / 代购': '#7a5bb5',
    '其他': '#7b837b'
  };
  const CONDITIONS = ['全新', '二手', '不确定'];
  const ACCESSORY_TYPES = [
    '手柄 / Joy-Con',
    '底座 / Dock',
    '收纳包 / 保护壳',
    '充电器 / 线材',
    '屏幕膜',
    '存储卡',
    '音频设备',
    '其他配件'
  ];

  const REGIONS = ['港服', '日服', '美服', '欧服', '国服', '其他'];
  const REGION_CURRENCY = {
    '港服': 'HKD',
    '日服': 'JPY',
    '美服': 'USD',
    '欧服': 'EUR',
    '国服': 'CNY',
    '其他': 'HKD'
  };
  const CURRENCIES = ['HKD', 'JPY', 'USD', 'EUR', 'GBP', 'CNY'];
  const PAYMENT_METHODS = ['balance', 'direct'];
  const VIEWS = ['overview', 'ledger', 'stats', 'settings'];
  const currencyDigitsCache = new Map();
  const THEMES = ['light', 'dark', 'system'];
  const CUSTOM_PLATFORM_PALETTE = ['#c45a36', '#4b7f8a', '#8a6b3f', '#5f7f53', '#a8576b', '#6f64a8', '#b57832', '#3f7a6e'];

  const money2 = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const moneyCompact = new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2
  });
  const dateShort = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    addBtn: $('#addBtn'),
    netCurrency: $('#netCurrency'),
    netSpend: $('#netSpend'),
    netLabel: $('#netLabel'),
    netLabelEn: $('#netLabelEn'),
    netCaption: $('#netCaption'),
    totalSpent: $('#totalSpent'),
    totalRecovered: $('#totalRecovered'),
    recoveryRate: $('#recoveryRate'),
    recoveryTrack: $('#recoveryTrack'),
    recoveryBar: $('#recoveryBar'),
    ownedCount: $('#ownedCount'),
    soldCount: $('#soldCount'),
    ownedHint: $('#ownedHint'),
    soldHint: $('#soldHint'),
    eshopGameCount: $('#eshopGameCount'),
    eshopGameHint: $('#eshopGameHint'),
    monthSpent: $('#monthSpent'),
    monthLabel: $('#monthLabel'),
    statsGrid: $('#statsGrid'),
    statsToggle: $('#statsToggle'),
    overviewView: $('#overviewView'),
    ledgerView: $('#ledgerView'),
    statsView: $('#statsView'),
    settingsView: $('#settingsView'),
    viewLinks: $$('[data-view-link]'),
    searchInput: $('#searchInput'),
    clearSearch: $('#clearSearch'),
    sortSelect: $('#sortSelect'),
    typeChips: $$('#typeFilterGroup [data-type]'),
    countAll: $('#countAll'),
    countOwned: $('#countOwned'),
    countSold: $('#countSold'),
    statusFilterGroup: $('#statusFilterGroup'),
    filterOwnedLabel: $('#filterOwnedLabel'),
    filterSoldLabel: $('#filterSoldLabel'),
    resultLabel: $('#resultLabel'),
    recordList: $('#recordList'),
    emptyState: $('#emptyState'),
    emptyTitle: $('#emptyTitle'),
    emptyText: $('#emptyText'),
    emptyAction: $('#emptyAction'),
    emptyActionText: $('#emptyActionText'),
    chartTotal: $('#chartTotal'),
    chart: $('#chart'),
    platformList: $('#platformList'),
    statsEmpty: $('#statsEmpty'),
    statsContent: $('#statsContent'),
    categoryList: $('#categoryList'),
    categoryTotal: $('#categoryTotal'),
    walletList: $('#walletList'),
    adjustWalletBtn: $('#adjustWalletBtn'),
    walletDetailDialog: $('#walletDetailDialog'),
    closeWalletDetail: $('#closeWalletDetail'),
    walletDetailTitle: $('#walletDetailTitle'),
    walletDetailSub: $('#walletDetailSub'),
    walletDetailRegion: $('#walletDetailRegion'),
    walletDetailCurrency: $('#walletDetailCurrency'),
    walletDetailBalance: $('#walletDetailBalance'),
    walletDetailBreakdown: $('#walletDetailBreakdown'),
    walletDetailAdjust: $('#walletDetailAdjust'),
    walletDetailPointcard: $('#walletDetailPointcard'),
    walletDetailEshop: $('#walletDetailEshop'),
    walletDetailTabs: $$('#walletDetailTabs [data-wallet-tab]'),
    walletDetailList: $('#walletDetailList'),
    walletDetailCountAll: $('#walletDetailCountAll'),
    walletDetailCountPointcard: $('#walletDetailCountPointcard'),
    walletDetailCountGame: $('#walletDetailCountGame'),
    openDataBtn: $('#openDataBtn'),
    installSideBtn: $('#installSideBtn'),
    storageNote: $('#storageNote'),
    restoreAllBtn: $('#restoreAllBtn'),
    restoreInput: $('#restoreInput'),
    settingsStorageNote: $('#settingsStorageNote'),
    themeChoices: $$('#themeOptions [data-theme-choice]'),
    optionTabs: $$('#optionTabs [data-option-kind]'),
    optionPanels: $$('[data-option-panel]'),
    optionTabCounts: {
      platform: $('#platformOptionCount'),
      accessory: $('#accessoryOptionCount'),
      region: $('#regionOptionCount')
    },
    platformSettingsList: $('#platformSettingsList'),
    accessorySettingsList: $('#accessorySettingsList'),
    regionSettingsList: $('#regionSettingsList'),
    newPlatformLabel: $('#newPlatformLabel'),
    addPlatformBtn: $('#addPlatformBtn'),
    newAccessoryLabel: $('#newAccessoryLabel'),
    addAccessoryBtn: $('#addAccessoryBtn'),
    newRegionLabel: $('#newRegionLabel'),
    newRegionCurrency: $('#newRegionCurrency'),
    addRegionBtn: $('#addRegionBtn'),
    resetSettingsBtn: $('#resetSettingsBtn'),
    checkUpdateBtn: $('#checkUpdateBtn'),
    appVersion: $('#appVersion'),
    recordDialog: $('#recordDialog'),
    recordDialogKicker: $('#recordDialogKicker'),
    recordDialogTitle: $('#recordDialogTitle'),
    recordDialogSub: $('#recordDialogSub'),
    closeRecord: $('#closeRecord'),
    recordForm: $('#recordForm'),
    gameTitle: $('#gameTitle'),
    nameLabel: $('#nameLabel'),
    categoryInputs: $$('input[name="category"]'),
    purchasePlatformField: $('#purchasePlatformField'),
    purchasePlatform: $('#purchasePlatform'),
    regionField: $('#regionField'),
    recordRegion: $('#recordRegion'),
    currencyField: $('#currencyField'),
    recordCurrency: $('#recordCurrency'),
    editionField: $('#editionField'),
    edition: $('#edition'),
    editionLabel: $('#editionLabel'),
    faceValueField: $('#faceValueField'),
    faceValue: $('#faceValue'),
    faceValueCurrency: $('#faceValueCurrency'),
    eshopPriceField: $('#eshopPriceField'),
    eshopPrice: $('#eshopPrice'),
    eshopPriceCurrency: $('#eshopPriceCurrency'),
    paymentMethodField: $('#paymentMethodField'),
    paymentMethod: $('#paymentMethod'),
    walletHint: $('#walletHint'),
    walletHintText: $('#walletHintText'),
    accessoryTypeField: $('#accessoryTypeField'),
    accessoryType: $('#accessoryType'),
    purchasePriceField: $('#purchasePriceField'),
    purchasePrice: $('#purchasePrice'),
    purchasePriceLabel: $('#purchasePriceLabel'),
    purchaseDate: $('#purchaseDate'),
    conditionField: $('#conditionField'),
    condition: $('#condition'),
    soldToggle: $('#soldToggle'),
    soldToggleTitle: $('#soldToggleTitle'),
    soldToggleHint: $('#soldToggleHint'),
    soldToggleField: $('#soldToggleField'),
    soldFields: $('#soldFields'),
    salePriceField: $('#salePriceField'),
    saleDateLabel: $('#saleDateLabel'),
    salePlatformField: $('#salePlatformField'),
    salePrice: $('#salePrice'),
    saleDate: $('#saleDate'),
    salePlatform: $('#salePlatform'),
    note: $('#note'),
    formError: $('#formError'),
    cancelRecord: $('#cancelRecord'),
    saveRecord: $('#saveRecord'),
    dataDialog: $('#dataDialog'),
    closeData: $('#closeData'),
    dataCount: $('#dataCount'),
    dataSize: $('#dataSize'),
    dataError: $('#dataError'),
    exportJsonBtn: $('#exportJsonBtn'),
    exportCsvBtn: $('#exportCsvBtn'),
    importBtn: $('#importBtn'),
    installFromDataBtn: $('#installFromDataBtn'),
    resetBtn: $('#resetBtn'),
    closeDataFoot: $('#closeDataFoot'),
    installDialog: $('#installDialog'),
    closeInstall: $('#closeInstall'),
    installSub: $('#installSub'),
    installSteps: $('#installSteps'),
    installNote: $('#installNote'),
    installPromptBtn: $('#installPromptBtn'),
    closeInstallFoot: $('#closeInstallFoot'),
    walletDialog: $('#walletDialog'),
    closeWallet: $('#closeWallet'),
    walletForm: $('#walletForm'),
    walletRegion: $('#walletRegion'),
    walletCurrency: $('#walletCurrency'),
    walletAmount: $('#walletAmount'),
    walletNote: $('#walletNote'),
    walletError: $('#walletError'),
    cancelWallet: $('#cancelWallet'),
    saveWallet: $('#saveWallet'),
    confirmDialog: $('#confirmDialog'),
    confirmTitle: $('#confirmTitle'),
    confirmMessage: $('#confirmMessage'),
    confirmCancel: $('#confirmCancel'),
    confirmOk: $('#confirmOk'),
    fileInput: $('#fileInput'),
    toast: $('#toast'),
    toastIcon: $('#toastIcon'),
    toastMessage: $('#toastMessage'),
    toastAction: $('#toastAction')
  };

  let records = [];
  let balanceAdjustments = [];
  let settings = createDefaultSettings();
  let ui = { filter: 'all', type: 'all', query: '', sort: 'newest' };
  let activeOptionKind = '';
  let walletDetailState = { region: '', currency: '', tab: 'all' };
  let deferredInstallPrompt = null;
  let confirmResolver = null;
  let toastTimer = 0;
  let toastActionHandler = null;
  let firstRender = true;
  let refreshingForUpdate = false;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function resolvedTheme() {
    const theme = THEMES.includes(settings.theme) ? settings.theme : 'light';
    if (theme === 'system') return systemThemeQuery.matches ? 'dark' : 'light';
    return theme;
  }

  function applyTheme() {
    const theme = resolvedTheme();
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#111814' : '#f2ede3';
  }

  function saveSettings(nextSettings, options = {}) {
    if (!nextSettings) return false;
    if (!commitState(records, balanceAdjustments, nextSettings)) return false;
    applyTheme();
    populateOptionSelects();
    renderSettings();
    if (options.render !== false) render();
    return true;
  }

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const pad = (value) => String(value).padStart(2, '0');

  function todayISO() {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function currentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  }

  function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }

  function normalizeDate(value) {
    const text = String(value || '').slice(0, 10);
    return isValidDateString(text) ? text : '';
  }

  function roundMoney(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return 0;
    return Math.round(number * 100) / 100;
  }

  function currencyDigits(currency) {
    const code = normalizeCurrencyCode(currency) || 'HKD';
    if (currencyDigitsCache.has(code)) return currencyDigitsCache.get(code);
    let digits = 2;
    try {
      const resolved = new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: code
      }).resolvedOptions();
      if (Number.isFinite(resolved.maximumFractionDigits)) {
        digits = Math.max(0, Math.min(4, resolved.maximumFractionDigits));
      }
    } catch (_) {
      digits = 2;
    }
    currencyDigitsCache.set(code, digits);
    return digits;
  }

  function currencyStep(currency) {
    const digits = currencyDigits(currency);
    return digits === 0 ? '1' : `0.${'0'.repeat(digits - 1)}1`;
  }

  function roundForCurrency(value, currency) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    const factor = 10 ** currencyDigits(currency);
    const rounded = Math.round(Math.abs(number) * factor) / factor;
    return number < 0 ? -rounded : rounded;
  }

  function createDefaultSettings() {
    return {
      theme: 'light',
      platforms: PLATFORMS.map((label) => ({ label, active: true, builtin: true })),
      accessoryTypes: ACCESSORY_TYPES.map((label) => ({ label, active: true, builtin: true })),
      regions: REGIONS.map((label) => ({
        label,
        currency: REGION_CURRENCY[label] || 'HKD',
        active: true,
        builtin: true
      }))
    };
  }

  function normalizeCurrencyCode(value) {
    const text = String(value || '').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(text) ? text : '';
  }

  function isProtectedOption(kind, label) {
    if (kind === 'platform' || kind === 'region') return label === '其他';
    if (kind === 'accessory') return label === '其他配件' || label === '其他';
    return false;
  }

  function customPlatformColor(label) {
    let hash = 0;
    for (let index = 0; index < label.length; index += 1) {
      hash = (hash * 31 + label.charCodeAt(index)) >>> 0;
    }
    return CUSTOM_PLATFORM_PALETTE[hash % CUSTOM_PLATFORM_PALETTE.length];
  }

  function normalizeSettings(raw) {
    const defaults = createDefaultSettings();
    const source = raw && typeof raw === 'object' ? raw : {};
    const theme = THEMES.includes(source.theme) ? source.theme : 'light';
    const list = Array.isArray(source.platforms) ? source.platforms : [];

    const defaultPlatforms = defaults.platforms;
    const rawPlatformMap = new Map();
    list.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const label = String(item.label || '').trim().slice(0, 30);
      if (!label || rawPlatformMap.has(label)) return;
      rawPlatformMap.set(label, item);
    });
    const platforms = defaultPlatforms.map((item) => {
      const found = rawPlatformMap.get(item.label);
      return {
        label: item.label,
        active: isProtectedOption('platform', item.label) ? true : found ? found.active !== false : true,
        builtin: true,
        color: PLATFORM_COLORS[item.label] || customPlatformColor(item.label)
      };
    });
    rawPlatformMap.forEach((item, label) => {
      if (defaultPlatforms.some((entry) => entry.label === label)) return;
      platforms.push({
        label,
        active: isProtectedOption('platform', label) ? true : item.active !== false,
        builtin: false,
        color: /^#[0-9a-f]{6}$/i.test(String(item.color || '')) ? item.color : customPlatformColor(label)
      });
    });

    const accessorySource = Array.isArray(source.accessoryTypes) ? source.accessoryTypes : [];
    const accessoryMap = new Map();
    accessorySource.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const label = String(item.label || '').trim().slice(0, 30);
      if (!label || accessoryMap.has(label)) return;
      accessoryMap.set(label, item);
    });
    const accessoryTypes = defaults.accessoryTypes.map((item) => {
      const found = accessoryMap.get(item.label);
      return {
        label: item.label,
        active: isProtectedOption('accessory', item.label) ? true : found ? found.active !== false : true,
        builtin: true
      };
    });
    accessoryMap.forEach((item, label) => {
      if (defaults.accessoryTypes.some((entry) => entry.label === label)) return;
      accessoryTypes.push({
        label,
        active: isProtectedOption('accessory', label) ? true : item.active !== false,
        builtin: false
      });
    });

    const regionSource = Array.isArray(source.regions) ? source.regions : [];
    const regionMap = new Map();
    regionSource.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const label = String(item.label || '').trim().slice(0, 30);
      if (!label || regionMap.has(label)) return;
      regionMap.set(label, item);
    });
    const regions = defaults.regions.map((item) => {
      const found = regionMap.get(item.label);
      return {
        label: item.label,
        currency: item.currency,
        active: isProtectedOption('region', item.label) ? true : found ? found.active !== false : true,
        builtin: true
      };
    });
    regionMap.forEach((item, label) => {
      if (defaults.regions.some((entry) => entry.label === label)) return;
      regions.push({
        label,
        currency: normalizeCurrencyCode(item.currency) || 'HKD',
        active: isProtectedOption('region', label) ? true : item.active !== false,
        builtin: false
      });
    });

    return { theme, platforms, accessoryTypes, regions };
  }

  function activePlatforms() {
    return settings.platforms.filter((item) => item.active);
  }

  function activeAccessoryTypes() {
    return settings.accessoryTypes.filter((item) => item.active);
  }

  function activeRegions() {
    return settings.regions.filter((item) => item.active);
  }

  function findRegionSetting(label) {
    return settings.regions.find((item) => item.label === label) || null;
  }

  function allCurrencies() {
    const set = new Set(CURRENCIES);
    settings.regions.forEach((region) => {
      if (normalizeCurrencyCode(region.currency)) set.add(region.currency);
    });
    return Array.from(set);
  }

  function normalizePlatform(value) {
    const text = String(value || '').trim().slice(0, 30);
    return text || '其他';
  }

  function normalizeCondition(value) {
    return CONDITIONS.includes(value) ? value : '全新';
  }

  function normalizeCategory(value) {
    if (value === 'accessory') return 'accessory';
    if (value === 'pointcard') return 'pointcard';
    if (value === 'eshop') return 'eshop';
    return 'cartridge';
  }

  function isPhysicalCategory(category) {
    return category === 'cartridge' || category === 'accessory';
  }

  function normalizeAccessoryType(value) {
    const text = String(value || '').trim().slice(0, 30);
    return text || '其他配件';
  }

  function normalizeRegionStrict(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    return findRegionSetting(text) || REGIONS.includes(text) ? text : '';
  }

  function normalizeRegion(value) {
    return String(value || '').trim().slice(0, 30);
  }

  function defaultCurrencyForRegion(region) {
    const found = findRegionSetting(region);
    return found ? found.currency : (REGION_CURRENCY[region] || 'HKD');
  }

  function normalizeCurrencyStrict(value) {
    return normalizeCurrencyCode(value);
  }

  function normalizeCurrency(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    return normalizeCurrencyStrict(text) || 'HKD';
  }

  function isFixedCurrencyRegion(region) {
    const found = findRegionSetting(region);
    return Boolean(found) && region !== '其他';
  }

  function effectiveCurrency(region, currency) {
    if (region === '其他') {
      return normalizeCurrencyStrict(currency) || defaultCurrencyForRegion(region);
    }
    const found = findRegionSetting(region);
    if (found) return found.currency;
    return normalizeCurrencyStrict(currency);
  }

  function normalizePaymentMethod(value) {
    return value === 'direct' ? 'direct' : 'balance';
  }

  function roundSigned(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.round(number * 100) / 100;
  }

  function parseLegacyPointcard(edition) {
    const text = String(edition || '');
    const amountMatch = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    let currency = 'CNY';
    let region = '其他';
    if (/港|HKD/i.test(text)) {
      currency = 'HKD';
      region = '港服';
    } else if (/日|JPY|日元/i.test(text)) {
      currency = 'JPY';
      region = '日服';
    } else if (/美|USD|美元/i.test(text)) {
      currency = 'USD';
      region = '美服';
    } else if (/欧|EUR|欧元/i.test(text)) {
      currency = 'EUR';
      region = '欧服';
    } else if (/国行|国服|CNY|人民币/i.test(text)) {
      currency = 'CNY';
      region = '国服';
    }
    return {
      faceValue: amountMatch ? roundMoney(amountMatch[1]) : 0,
      region,
      currency
    };
  }

  const currencyFormatters = new Map();
  function currencyPrefix(currencyCode) {
    return normalizeCurrencyCode(currencyCode) || 'HKD';
  }

  function formatCurrencyAmount(value, currencyCode) {
    const code = normalizeCurrencyCode(currencyCode) || 'HKD';
    const number = Number(value) || 0;
    if (!currencyFormatters.has(code)) {
      const digits = currencyDigits(code);
      try {
        currencyFormatters.set(code, new Intl.NumberFormat('zh-CN', {
          style: 'currency',
          currency: code,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits
        }));
      } catch (_) {
        currencyFormatters.set(code, null);
      }
    }
    const formatter = currencyFormatters.get(code);
    if (formatter) return formatter.format(number);
    return `${code} ${money2.format(number)}`;
  }

  function recordCashSpend(record) {
    if (record.category === 'eshop') {
      return record.paymentMethod === 'direct' ? record.purchasePrice : 0;
    }
    return record.purchasePrice;
  }

  function walletKey(region, currency) {
    return `${region}|${currency}`;
  }

  function recordWalletContribution(record) {
    if (!record) return 0;
    if (record.category === 'pointcard') return record.faceValue;
    if (record.category === 'eshop' && record.paymentMethod === 'balance') return -record.eshopPrice;
    return 0;
  }

  function computeWallets() {
    const map = new Map();
    const getWallet = (region, currency) => {
      const key = walletKey(region, currency);
      if (!map.has(key)) {
        map.set(key, {
          key,
          region,
          currency,
          topup: 0,
          spent: 0,
          adjustment: 0,
          pointcardCount: 0,
          gameCount: 0
        });
      }
      return map.get(key);
    };

    records.forEach((record) => {
      if (record.category === 'pointcard' && record.faceValue > 0) {
        const wallet = getWallet(record.region || '其他', record.currency || 'HKD');
        wallet.topup += record.faceValue;
        wallet.pointcardCount += 1;
      } else if (record.category === 'eshop' && record.paymentMethod === 'balance' && record.eshopPrice > 0) {
        const wallet = getWallet(record.region || '其他', record.currency || 'HKD');
        wallet.spent += record.eshopPrice;
        wallet.gameCount += 1;
      }
    });

    balanceAdjustments.forEach((adjustment) => {
      const wallet = getWallet(adjustment.region || '其他', adjustment.currency || 'HKD');
      wallet.adjustment += adjustment.amount;
    });

    return Array.from(map.values())
      .map((wallet) => ({
        ...wallet,
        balance: roundSigned(wallet.topup - wallet.spent + wallet.adjustment)
      }))
      .filter((wallet) => wallet.topup !== 0 || wallet.spent !== 0 || wallet.adjustment !== 0)
      .sort((a, b) => a.region.localeCompare(b.region, 'zh-CN') || a.currency.localeCompare(b.currency));
  }

  function walletBalance(region, currency) {
    const wallet = computeWallets().find((item) => item.region === region && item.currency === currency);
    return wallet ? wallet.balance : 0;
  }

  function uid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function normalizeRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = String(raw.title || '').trim().slice(0, 120);
    if (!title) return null;
    const category = normalizeCategory(raw.category);
    const physical = isPhysicalCategory(category);
    const pointcard = category === 'pointcard';
    const eshop = category === 'eshop';
    const legacyPointcard = pointcard ? parseLegacyPointcard(raw.edition) : null;
    const rawRegion = String(raw.region || '').trim().slice(0, 30);
    const configuredRegion = normalizeRegionStrict(rawRegion);
    const region = (pointcard || eshop)
      ? (configuredRegion || legacyPointcard?.region || rawRegion || '其他')
      : '';
    const regionSetting = findRegionSetting(region);
    const explicitCurrency = normalizeCurrencyCode(raw.currency);
    const currency = (pointcard || eshop)
      ? (regionSetting
        ? (region === '其他' && explicitCurrency ? explicitCurrency : regionSetting.currency)
        : (explicitCurrency || normalizeCurrencyCode(legacyPointcard?.currency) || defaultCurrencyForRegion(region)))
      : '';
    const rawFaceValue = Number(raw.faceValue);
    const hasFaceValue = Number.isFinite(rawFaceValue) && rawFaceValue > 0;
    const faceValue = pointcard
      ? (hasFaceValue
        ? roundForCurrency(rawFaceValue, currency)
        : (legacyPointcard?.faceValue ? roundForCurrency(legacyPointcard.faceValue, currency) : 0))
      : 0;
    const eshopPrice = eshop ? Math.max(0, roundForCurrency(raw.eshopPrice, currency)) : 0;
    const paymentMethod = eshop ? normalizePaymentMethod(raw.paymentMethod) : '';
    const sold = physical && (raw.sold === true || raw.sold === 'true' || raw.sold === 1);
    const createdAt = String(raw.createdAt || new Date().toISOString());
    const purchaseDate = normalizeDate(raw.purchaseDate) || normalizeDate(createdAt.slice(0, 10)) || todayISO();
    const saleDate = normalizeDate(raw.saleDate);
    const purchasePrice = eshop && paymentMethod === 'balance' ? 0 : roundMoney(raw.purchasePrice);
    return {
      id: String(raw.id || uid()).slice(0, 80),
      title,
      category,
      accessoryType: category === 'accessory' ? normalizeAccessoryType(raw.accessoryType) : '',
      platform: eshop ? 'eShop' : normalizePlatform(raw.platform),
      edition: physical ? String(raw.edition || '').trim().slice(0, 40) : '',
      region,
      currency,
      faceValue,
      eshopPrice,
      paymentMethod,
      purchasePrice,
      purchaseDate,
      condition: physical ? normalizeCondition(raw.condition) : '全新',
      sold,
      salePrice: sold ? roundMoney(raw.salePrice) : 0,
      saleDate: sold ? saleDate : '',
      salePlatform: sold ? normalizePlatform(raw.salePlatform) : '',
      note: String(raw.note || '').trim().slice(0, 500),
      createdAt,
      updatedAt: String(raw.updatedAt || new Date().toISOString())
    };
  }


  function normalizeAdjustment(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const region = normalizeRegion(raw.region) || '其他';
    const regionSetting = findRegionSetting(region);
    const explicitCurrency = normalizeCurrencyCode(raw.currency);
    const currency = regionSetting
      ? (region === '其他' && explicitCurrency ? explicitCurrency : regionSetting.currency)
      : (explicitCurrency || normalizeCurrency(raw.currency) || 'HKD');
    const amount = roundForCurrency(raw.amount, currency);
    if (!Number.isFinite(amount) || amount === 0) return null;
    return {
      id: String(raw.id || uid()).slice(0, 80),
      region,
      currency,
      amount,
      note: String(raw.note || '').trim().slice(0, 120),
      createdAt: String(raw.createdAt || new Date().toISOString())
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        settings = createDefaultSettings();
        return { records: [], adjustments: [], settings };
      }
      const parsed = JSON.parse(raw);
      const objectState = parsed && !Array.isArray(parsed) ? parsed : null;
      settings = normalizeSettings(objectState ? objectState.settings : null);
      const list = Array.isArray(parsed) ? parsed : objectState && objectState.records;
      const records = Array.isArray(list) ? list.map(normalizeRecord).filter(Boolean) : [];
      const adjustmentList = objectState && Array.isArray(objectState.adjustments) ? objectState.adjustments : [];
      const adjustments = adjustmentList.map(normalizeAdjustment).filter(Boolean);
      return { records, adjustments, settings };
    } catch (error) {
      console.warn('读取本地账本失败', error);
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) localStorage.setItem(`${STORAGE_KEY}.corrupt.${Date.now()}`, raw);
      } catch (_) {
        // 留一份原始数据失败时，不影响页面继续打开。
      }
      settings = createDefaultSettings();
      window.setTimeout(() => {
        showToast('本地账本读取失败，原始数据已尽量保留', { type: 'error', duration: 5200 });
      }, 400);
      return { records: [], adjustments: [], settings };
    }
  }

  function getMeta() {
    try {
      const parsed = JSON.parse(localStorage.getItem(META_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function setMeta(patch) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ ...getMeta(), ...patch }));
    } catch (_) {
      // 元数据写入失败不影响主数据。
    }
  }

  function touchChangeMeta() {
    setMeta({ lastChangeAt: new Date().toISOString() });
  }

  function commitState(nextRecords, nextAdjustments, nextSettings = settings) {
    if (!Array.isArray(nextRecords) || !Array.isArray(nextAdjustments) || !nextSettings) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        app: APP_ID,
        version: APP_VERSION,
        updatedAt: new Date().toISOString(),
        records: nextRecords,
        adjustments: nextAdjustments,
        settings: nextSettings
      }));
    } catch (error) {
      console.error('保存账本失败', error);
      showToast('保存失败：浏览器本地存储空间可能已满', { type: 'error', duration: 5200 });
      return false;
    }
    records = nextRecords;
    balanceAdjustments = nextAdjustments;
    settings = nextSettings;
    touchChangeMeta();
    return true;
  }

  function formatMoney2(value) {
    return money2.format(Number(value) || 0);
  }

  function formatCompact(value) {
    return moneyCompact.format(Number(value) || 0);
  }

  function formatShortMoney(value) {
    const number = Number(value) || 0;
    if (number >= 10000) {
      return `${(number / 10000).toFixed(number % 10000 === 0 ? 0 : 1).replace(/\.0$/, '')}万`;
    }
    if (number >= 1000) {
      return `${(number / 1000).toFixed(number % 1000 === 0 ? 0 : 1).replace(/\.0$/, '')}k`;
    }
    return number > 0 ? String(Math.round(number)) : '';
  }

  function formatNetCost(value) {
    const number = Math.round((Number(value) || 0) * 100) / 100;
    if (number < 0) return `−¥${formatCompact(Math.abs(number))}`;
    return `¥${formatCompact(number)}`;
  }

  function formatDate(value) {
    if (!isValidDateString(value)) return '';
    const [year, month, day] = value.split('-');
    return `${year}.${month}.${day}`;
  }

  function formatBackupDate(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    try {
      return dateShort.format(date).replace(/\//g, '.');
    } catch (_) {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  }

  function platformColor(platform) {
    const found = settings.platforms.find((item) => item.label === platform);
    if (found && found.color) return found.color;
    if (PLATFORM_COLORS[platform]) return PLATFORM_COLORS[platform];
    return customPlatformColor(platform || '其他');
  }

  function categoryLabel(record) {
    if (record.category === 'pointcard') return '点卡';
    if (record.category === 'eshop') return 'eShop';
    if (record.category !== 'accessory') return '卡带';
    return String(record.accessoryType || '配件').split(' / ')[0] || '配件';
  }

  function computeStats() {
    const totalSpent = records.reduce((sum, record) => sum + recordCashSpend(record), 0);
    const totalRecovered = records.reduce(
      (sum, record) => sum + (record.sold ? record.salePrice : 0),
      0
    );
    const physicalRecords = records.filter((record) => isPhysicalCategory(record.category));
    const soldRecords = physicalRecords.filter((record) => record.sold);
    const ownedRecords = physicalRecords.filter((record) => !record.sold);
    const eshopGames = records.filter((record) => record.category === 'eshop');
    const eshopBalanceGames = eshopGames.filter((record) => record.paymentMethod === 'balance');
    const eshopDirectGames = eshopGames.filter((record) => record.paymentMethod === 'direct');
    const net = totalSpent - totalRecovered;
    const rate = totalSpent > 0 ? (totalRecovered / totalSpent) * 100 : 0;
    const monthKey = currentMonthKey();
    const monthSpent = records
      .filter((record) => record.purchaseDate.slice(0, 7) === monthKey)
      .reduce((sum, record) => sum + recordCashSpend(record), 0);
    return {
      totalSpent,
      totalRecovered,
      net,
      rate,
      soldCount: soldRecords.length,
      ownedCount: ownedRecords.length,
      ownedCartridges: ownedRecords.filter((record) => record.category === 'cartridge').length,
      ownedAccessories: ownedRecords.filter((record) => record.category === 'accessory').length,
      soldCartridges: soldRecords.filter((record) => record.category === 'cartridge').length,
      soldAccessories: soldRecords.filter((record) => record.category === 'accessory').length,
      eshopGameCount: eshopGames.length,
      eshopBalanceCount: eshopBalanceGames.length,
      eshopDirectCount: eshopDirectGames.length,
      monthSpent
    };
  }

  function renderOverview(stats) {
    const negative = stats.net < 0;
    els.netLabel.textContent = negative ? '当前净收益' : '当前净花费';
    els.netLabelEn.textContent = negative ? 'NET GAIN' : 'NET SPEND';
    els.netCurrency.textContent = negative ? '+¥' : '¥';
    els.netSpend.textContent = formatMoney2(Math.abs(stats.net));
    els.totalSpent.textContent = formatMoney2(stats.totalSpent);
    els.totalRecovered.textContent = formatMoney2(stats.totalRecovered);
    els.ownedCount.textContent = String(stats.ownedCount);
    els.soldCount.textContent = String(stats.soldCount);
    els.ownedHint.textContent = `卡带 ${stats.ownedCartridges} · 配件 ${stats.ownedAccessories}`;
    els.soldHint.textContent = `卡带 ${stats.soldCartridges} · 配件 ${stats.soldAccessories}`;
    els.eshopGameCount.textContent = String(stats.eshopGameCount);
    els.eshopGameHint.textContent = `余额 ${stats.eshopBalanceCount} · 直购 ${stats.eshopDirectCount}`;
    els.monthSpent.textContent = formatCompact(stats.monthSpent);
    els.monthLabel.textContent = `${new Date().getMonth() + 1} 月花出去的现金`;

    const rateLabel = `${stats.rate.toFixed(stats.rate > 0 && stats.rate < 10 ? 1 : 0)}%`;
    els.recoveryRate.textContent = rateLabel;
    els.recoveryBar.style.width = `${Math.min(100, Math.max(0, stats.rate))}%`;
    els.recoveryTrack.setAttribute('aria-valuenow', String(Math.round(Math.min(100, stats.rate))));

    if (!records.length) {
      els.netCaption.textContent = '现金支出减去二手回血，才是这些物品真正的净花费；余额购游戏不会重复计入。';
    } else if (stats.totalRecovered === 0) {
      els.netCaption.textContent = '还没有二手回血，先记下每一笔现金支出。';
    } else if (stats.net < 0) {
      els.netCaption.textContent = `二手回血已覆盖全部成本，还多出 ¥${formatCompact(Math.abs(stats.net))}。`;
    } else if (stats.net === 0) {
      els.netCaption.textContent = '二手回血刚好覆盖全部现金支出。';
    } else {
      els.netCaption.textContent = `已出 ${stats.soldCount} 件，二手回血抵消了约 ${Math.round(stats.rate)}% 现金支出。`;
    }
  }

  function getVisibleRecords() {
    const query = ui.query.trim().toLocaleLowerCase('zh-CN');
    let list = records.filter((record) => {
      if (ui.type !== 'all') {
        const typeMatch = ui.type === 'physical'
          ? isPhysicalCategory(record.category)
          : record.category === ui.type;
        if (!typeMatch) return false;
      }
      const physical = isPhysicalCategory(record.category);
      if (ui.filter === 'owned' && (!physical || record.sold)) return false;
      if (ui.filter === 'sold' && (!physical || !record.sold)) return false;
      if (!query) return true;
      const categoryText = record.category === 'pointcard'
        ? '点卡'
        : (record.category === 'eshop'
          ? 'eShop 数字版'
          : (record.category === 'accessory' ? '配件' : '卡带'));
      const haystack = [
        record.title,
        categoryText,
        record.accessoryType,
        record.platform,
        record.edition,
        record.region,
        record.currency,
        record.paymentMethod === 'direct' ? '直购' : (record.paymentMethod === 'balance' ? '余额支付' : ''),
        record.condition,
        record.note,
        record.salePlatform,
        record.purchaseDate,
        record.saleDate
      ].join(' ').toLocaleLowerCase('zh-CN');
      return haystack.includes(query);
    });

    list = list.slice();
    if (ui.sort === 'price-desc') {
      list.sort((a, b) => recordCashSpend(b) - recordCashSpend(a) || b.purchaseDate.localeCompare(a.purchaseDate));
    } else if (ui.sort === 'price-asc') {
      list.sort((a, b) => recordCashSpend(a) - recordCashSpend(b) || b.purchaseDate.localeCompare(a.purchaseDate));
    } else if (ui.sort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
    } else {
      list.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate) || b.createdAt.localeCompare(a.createdAt));
    }
    return list;
  }

  function renderFilters(visible) {
    const scoped = records.filter((record) => {
      if (ui.type === 'all') return true;
      if (ui.type === 'physical') return isPhysicalCategory(record.category);
      return record.category === ui.type;
    });
    const physicalScoped = scoped.filter((record) => isPhysicalCategory(record.category));
    const owned = physicalScoped.filter((record) => !record.sold).length;
    const sold = physicalScoped.filter((record) => record.sold).length;
    const statusRelevant = ['physical', 'cartridge', 'accessory'].includes(ui.type);
    els.countAll.textContent = String(scoped.length);
    els.countOwned.textContent = String(owned);
    els.countSold.textContent = String(sold);
    els.resultLabel.textContent = `共 ${visible.length} 件物品`;

    const cartridgeTotal = records.filter((record) => record.category === 'cartridge').length;
    const accessoryTotal = records.filter((record) => record.category === 'accessory').length;
    const pointcardTotal = records.filter((record) => record.category === 'pointcard').length;
    const eshopTotal = records.filter((record) => record.category === 'eshop').length;
    const physicalTotal = cartridgeTotal + accessoryTotal;
    const typeTotals = {
      all: records.length,
      physical: physicalTotal,
      cartridge: cartridgeTotal,
      accessory: accessoryTotal,
      pointcard: pointcardTotal,
      eshop: eshopTotal
    };
    els.typeChips.forEach((button) => {
      const type = button.dataset.type;
      const countEl = button.querySelector('.chip-count');
      if (countEl) countEl.textContent = String(typeTotals[type] || 0);
      const active = type === ui.type;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    els.filterOwnedLabel.textContent = '在库';
    els.filterSoldLabel.textContent = '已出';
    els.statusFilterGroup.hidden = !statusRelevant;

    $$('button', els.statusFilterGroup).forEach((button) => {
      const active = button.dataset.filter === ui.filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    els.clearSearch.hidden = !ui.query;
  }

  function setTypeFilter(type) {
    if (!['all', 'physical', 'cartridge', 'accessory', 'pointcard', 'eshop'].includes(type)) return;
    ui.type = type;
    if (!['physical', 'cartridge', 'accessory'].includes(type)) ui.filter = 'all';
    render();
  }

  function setStatsExpanded(expanded, options = {}) {
    const isExpanded = Boolean(expanded);
    els.statsGrid.classList.toggle('is-expanded', isExpanded);
    els.statsToggle.setAttribute('aria-expanded', String(isExpanded));
    els.statsToggle.textContent = isExpanded ? '收起统计' : '查看统计明细';
    if (options.persist) setMeta({ statsExpanded: isExpanded });
  }

  function recordCardMarkup(record) {
    const firstChar = Array.from(record.title)[0] || '?';
    const pointcard = record.category === 'pointcard';
    const eshop = record.category === 'eshop';
    const physical = isPhysicalCategory(record.category);
    const netCost = record.purchasePrice - (record.sold ? record.salePrice : 0);
    const kind = categoryLabel(record);
    const kindTitle = pointcard
      ? `点卡 · ${record.region || '未分区'}`
      : (eshop
        ? `eShop · ${record.region || '未分区'}`
        : (record.category === 'accessory' ? `配件 · ${record.accessoryType}` : '卡带'));
    const meta = physical
      ? [
        `<span class="record-kind${record.category === 'accessory' ? ' is-accessory' : ''}" title="${escapeHtml(kindTitle)}">${escapeHtml(kind)}</span>`,
        `<span>${escapeHtml(record.platform)}</span>`,
        record.edition ? `<span>${escapeHtml(record.edition)}</span>` : '',
        `<span>${escapeHtml(formatDate(record.purchaseDate))}</span>`
      ].filter(Boolean)
      : [
        `<span class="record-kind ${pointcard ? 'is-pointcard' : 'is-eshop'}" title="${escapeHtml(kindTitle)}">${escapeHtml(kind)}</span>`,
        `<span>${escapeHtml(record.region || '未分区')}</span>`,
        !eshop ? `<span>${escapeHtml(record.platform)}</span>` : '',
        `<span>${escapeHtml(formatDate(record.purchaseDate))}</span>`
      ].filter(Boolean);
    const note = record.note
      ? `<p class="record-note" title="${escapeHtml(record.note)}">${escapeHtml(record.note)}</p>`
      : '';
    const saleLine = physical && record.sold
      ? `<p class="record-sale-line"><span class="sale-pin" aria-hidden="true"></span>已出 · ${escapeHtml(formatDate(record.saleDate) || '日期未填')} · ${escapeHtml(record.salePlatform || '平台未填')}</p>`
      : '';
    let money;
    if (pointcard) {
      money = `<span class="money-label">面值</span><strong>${formatCurrencyAmount(record.faceValue, record.currency)}</strong><span class="money-sub is-purchase">购入 ¥${formatCompact(record.purchasePrice)}</span>`;
    } else if (eshop) {
      const payment = record.paymentMethod === 'direct'
        ? `实付 ¥${formatCompact(record.purchasePrice)}`
        : '余额支付';
      money = `<span class="money-label">eShop 价</span><strong>${formatCurrencyAmount(record.eshopPrice, record.currency)}</strong><span class="money-sub is-balance">${payment}</span>`;
    } else if (record.sold) {
      money = `<span class="money-label">净成本</span><strong>${formatNetCost(netCost)}</strong><span class="money-sub">购入 ¥${formatCompact(record.purchasePrice)} · 回血 ¥${formatCompact(record.salePrice)}</span>`;
    } else {
      money = `<span class="money-label">购入价</span><strong>¥${formatCompact(record.purchasePrice)}</strong>`;
    }

    let statusLabel = record.sold ? '已出' : '在库';
    let statusClass = record.sold ? 'status-sold' : 'status-owned';
    if (pointcard) {
      statusLabel = '充值';
      statusClass = 'status-topup';
    } else if (eshop) {
      statusLabel = record.paymentMethod === 'direct' ? '直购' : '余额';
      statusClass = record.paymentMethod === 'direct' ? 'status-direct' : 'status-eshop';
    }
    const articleClasses = [
      record.sold ? 'is-sold' : '',
      pointcard ? 'is-pointcard' : '',
      eshop ? 'is-eshop' : ''
    ].filter(Boolean).join(' ');

    return `
      <article class="record-card${articleClasses ? ` ${articleClasses}` : ''}" role="listitem" data-id="${escapeHtml(record.id)}">
        <div class="game-token" style="--token:${platformColor(record.platform)}" aria-hidden="true"><span>${escapeHtml(firstChar)}</span></div>
        <div class="record-body">
          <div class="record-title-row">
            <h3 class="record-title" title="${escapeHtml(record.title)}">${escapeHtml(record.title)}</h3>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="record-meta">
            ${meta.join('<span class="meta-dot" aria-hidden="true"></span>')}
          </div>
          ${saleLine}
          ${note}
        </div>
        <div class="record-money">${money}</div>
        <div class="record-actions">
          <button class="card-action" type="button" data-action="edit" aria-label="编辑 ${escapeHtml(record.title)}" title="编辑">
            <svg class="icon" aria-hidden="true"><use href="#i-edit"></use></svg>
          </button>
          <button class="card-action delete" type="button" data-action="delete" aria-label="删除 ${escapeHtml(record.title)}" title="删除">
            <svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg>
          </button>
        </div>
      </article>
    `;
  }

  function renderRecords(visible) {
    els.recordList.classList.toggle('no-animation', !firstRender);
    els.recordList.innerHTML = visible.map(recordCardMarkup).join('');
    firstRender = false;

    const hasVisible = visible.length > 0;
    els.recordList.hidden = !hasVisible;
    els.emptyState.classList.toggle('is-visible', !hasVisible);

    if (!hasVisible) {
      const typeRecords = records.filter((record) => {
        if (ui.type === 'all') return true;
        if (ui.type === 'physical') return isPhysicalCategory(record.category);
        return record.category === ui.type;
      });
      if (ui.type !== 'all' && !typeRecords.length) {
        const accessory = ui.type === 'accessory';
        const physical = ui.type === 'physical';
        const pointcard = ui.type === 'pointcard';
        const eshop = ui.type === 'eshop';
        els.emptyTitle.textContent = eshop
          ? '还没有 eShop 游戏'
          : (pointcard
            ? '还没有点卡记录'
            : (physical ? '还没有卡带或配件' : (accessory ? '还没有配件记录' : '还没有卡带记录')));
        els.emptyText.textContent = eshop
          ? '记录在 eShop 购买的数字版游戏，区分余额支付和直购。'
          : (pointcard
            ? '记下点卡面值、区服和购入价，面值会自动充入对应余额。'
            : (physical
              ? '卡带和配件都在这里管理，先记一件实体物品吧。'
              : (accessory
                ? '手柄、收纳包、底座等 Switch 配件都可以记在这里。'
                : '先记一张游戏卡带，再慢慢补全购入和出售信息。')));
        els.emptyActionText.textContent = eshop
          ? '记一款 eShop 游戏'
          : (pointcard
            ? '记一张点卡'
            : (physical ? '记一件实体物品' : (accessory ? '记一件配件' : '记一张卡带')));
        els.emptyAction.dataset.mode = eshop
          ? 'add-eshop'
          : (pointcard
            ? 'add-pointcard'
            : (physical ? 'add-cartridge' : (accessory ? 'add-accessory' : 'add-cartridge')));
      } else if (!records.length) {
        els.emptyTitle.textContent = '还没有物品记录';
        els.emptyText.textContent = '从第一件 Switch 物品开始，把购入价、余额支付或二手去处都记下来。';
        els.emptyActionText.textContent = '记第一件物品';
        els.emptyAction.dataset.mode = 'add';
      } else if (ui.query) {
        els.emptyTitle.textContent = '没有找到匹配的物品';
        els.emptyText.textContent = `没有与「${ui.query}」匹配的记录，换个关键词试试。`;
        els.emptyActionText.textContent = '清空搜索';
        els.emptyAction.dataset.mode = 'reset';
      } else if (ui.filter === 'owned') {
        els.emptyTitle.textContent = '没有在库的物品';
        els.emptyText.textContent = '当前卡带与配件都已经出二手，或者可以切换筛选条件看看。';
        els.emptyActionText.textContent = '查看全部物品';
        els.emptyAction.dataset.mode = 'clear-filter';
      } else {
        els.emptyTitle.textContent = '还没有出过二手';
        els.emptyText.textContent = '切换筛选条件，或者继续记录下一件物品。';
        els.emptyActionText.textContent = '查看全部物品';
        els.emptyAction.dataset.mode = 'clear-filter';
      }
    }
  }

  function lastSixMonths() {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}`,
        label: `${date.getMonth() + 1}月`,
        year: date.getFullYear(),
        isCurrent: index === 5
      };
    });
  }

  function renderChart() {
    const months = lastSixMonths();
    const totals = months.map((month) =>
      records
        .filter((record) => record.purchaseDate.slice(0, 7) === month.key)
        .reduce((sum, record) => sum + recordCashSpend(record), 0)
    );
    const max = Math.max(...totals, 1);
    const rangeTotal = totals.reduce((sum, value) => sum + value, 0);
    els.chartTotal.textContent = `¥${formatCompact(rangeTotal)}`;

    els.chart.innerHTML = months.map((month, index) => {
      const amount = totals[index];
      const height = amount > 0 ? Math.max(7, (amount / max) * 100) : 0;
      return `
        <div class="chart-col${month.isCurrent ? ' is-current' : ''}" title="${month.year}年${month.label} · ¥${formatCompact(amount)}">
          <span class="chart-value">${amount > 0 ? formatShortMoney(amount) : ''}</span>
          <div class="chart-track"><span class="chart-bar${amount === 0 ? ' is-zero' : ''}" style="height:${height}%"></span></div>
          <span class="chart-label">${month.label}</span>
        </div>
      `;
    }).join('');

    const description = months
      .map((month, index) => `${month.year}年${month.label} ¥${formatCompact(totals[index])}`)
      .join('，');
    els.chart.setAttribute('aria-label', `近六个月现金支出：${description}`);
  }

  function renderPlatforms() {
    const totals = new Map();
    records.forEach((record) => {
      const cash = recordCashSpend(record);
      if (cash <= 0) return;
      totals.set(record.platform, (totals.get(record.platform) || 0) + cash);
    });
    const list = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    if (!list.length) {
      els.platformList.innerHTML = '<p class="platform-empty">记录现金支出后，这里会显示平台占比。</p>';
      return;
    }
    let visible = list.slice(0, 5);
    if (list.length > 5) {
      const rest = list.slice(4).reduce((sum, entry) => sum + entry[1], 0);
      visible = [...list.slice(0, 4), ['其他平台', rest]];
    }
    const max = Math.max(...visible.map((entry) => entry[1]), 1);
    els.platformList.innerHTML = visible.map(([platform, amount]) => `
      <div class="platform-row" style="--dot:${platformColor(platform)}">
        <div class="platform-info">
          <span><i class="platform-dot" aria-hidden="true"></i>${escapeHtml(platform)}</span>
          <b>¥${formatCompact(amount)}</b>
        </div>
        <div class="platform-track"><i style="width:${Math.max(4, (amount / max) * 100)}%"></i></div>
      </div>
    `).join('');
  }

  function renderWallets() {
    const wallets = computeWallets();
    els.walletList.classList.toggle('is-single', wallets.length === 1);
    els.walletList.classList.toggle('is-empty', wallets.length === 0);
    if (!wallets.length) {
      els.walletList.innerHTML = `
        <div class="wallet-empty">
          <div>
            <strong>还没有余额记录</strong>
            <p>记一张点卡会自动入账，也可以手动补充期初余额。</p>
          </div>
          <button class="wallet-empty-action" type="button" data-action="adjust">添加余额</button>
        </div>
      `;
      return;
    }

    els.walletList.innerHTML = wallets.map((wallet) => {
      const negative = wallet.balance < 0;
      const directGames = records.filter((record) =>
        record.category === 'eshop' &&
        record.region === wallet.region &&
        record.currency === wallet.currency &&
        record.paymentMethod === 'direct'
      ).length;
      const totalGames = wallet.gameCount + directGames;
      const parts = [];
      if (wallet.pointcardCount) parts.push(`点卡 ${wallet.pointcardCount} 张`);
      if (totalGames) parts.push(`游戏 ${totalGames} 款`);
      if (wallet.adjustment !== 0) parts.push('含手动调整');
      return `
        <div class="wallet-card${negative ? ' is-negative' : ''}" role="button" tabindex="0" data-action="detail" data-region="${escapeHtml(wallet.region)}" data-currency="${escapeHtml(wallet.currency)}" aria-label="查看 ${escapeHtml(wallet.region)} ${escapeHtml(wallet.currency)} 余额明细">
          <span class="wallet-card-top">
            <span class="wallet-region">${escapeHtml(wallet.region)}</span>
            <span class="wallet-currency">${escapeHtml(wallet.currency)}</span>
          </span>
          <strong class="wallet-amount">${formatCurrencyAmount(wallet.balance, wallet.currency)}</strong>
          <span class="wallet-meta">${negative ? '余额不足：补记点卡或调整余额' : (parts.join(' · ') || '手动余额')}</span>
          <span class="wallet-card-foot">
            <button class="wallet-edit wallet-adjust-link" type="button" data-action="adjust" data-region="${escapeHtml(wallet.region)}" data-currency="${escapeHtml(wallet.currency)}">${negative ? '去补录' : '调整'} <svg class="icon" aria-hidden="true"><use href="#i-edit"></use></svg></button>
            <span class="wallet-open">明细 <svg class="icon" aria-hidden="true"><use href="#i-chevron"></use></svg></span>
          </span>
        </div>
      `;
    }).join('');
  }


  function signedCurrencyAmount(value, currency) {
    const number = Number(value) || 0;
    const formatted = formatCurrencyAmount(Math.abs(number), currency);
    if (number > 0) return `+${formatted}`;
    if (number < 0) return `−${formatted}`;
    return formatted;
  }

  function walletDetailData(region, currency) {
    const pointcards = records.filter((record) =>
      record.category === 'pointcard' && record.region === region && record.currency === currency
    );
    const games = records.filter((record) =>
      record.category === 'eshop' && record.region === region && record.currency === currency
    );
    const adjustments = balanceAdjustments.filter((adjustment) =>
      adjustment.region === region && adjustment.currency === currency
    );
    return { pointcards, games, adjustments };
  }

  function walletDetailRowMarkup(item) {
    if (item.kind === 'pointcard') {
      return `
        <button class="wallet-detail-row" type="button" data-id="${escapeHtml(item.record.id)}">
          <span class="wallet-detail-date">${escapeHtml(formatDate(item.record.purchaseDate))}</span>
          <span class="wallet-detail-copy">
            <strong>${escapeHtml(item.record.title)}</strong>
            <span>点卡 · ${escapeHtml(item.record.region)} · ${escapeHtml(item.record.platform)}</span>
            <em>购入 ¥${formatMoney2(item.record.purchasePrice)}</em>
          </span>
          <span class="wallet-detail-amount is-positive">
            <strong>${signedCurrencyAmount(item.record.faceValue, item.record.currency)}</strong>
            <span>充值</span>
          </span>
        </button>
      `;
    }
    if (item.kind === 'game') {
      const direct = item.record.paymentMethod === 'direct';
      return `
        <button class="wallet-detail-row" type="button" data-id="${escapeHtml(item.record.id)}">
          <span class="wallet-detail-date">${escapeHtml(formatDate(item.record.purchaseDate))}</span>
          <span class="wallet-detail-copy">
            <strong>${escapeHtml(item.record.title)}</strong>
            <span>eShop · ${escapeHtml(item.record.region)} · ${direct ? '直购' : '余额支付'}</span>
            <em>${direct ? `实付 ¥${formatMoney2(item.record.purchasePrice)} · 不扣余额` : '余额支付'}</em>
          </span>
          <span class="wallet-detail-amount ${direct ? 'is-neutral' : 'is-negative'}">
            <strong>${direct ? formatCurrencyAmount(item.record.eshopPrice, item.record.currency) : `−${formatCurrencyAmount(item.record.eshopPrice, item.record.currency)}`}</strong>
            <span>${direct ? '标价' : '扣余额'}</span>
          </span>
        </button>
      `;
    }
    return `
      <div class="wallet-detail-row is-adjustment">
        <span class="wallet-detail-date">${escapeHtml(formatDate(item.record.createdAt ? item.record.createdAt.slice(0, 10) : ''))}</span>
        <span class="wallet-detail-copy">
          <strong>手动调整</strong>
          <span>${escapeHtml(item.record.note || '余额修正')}</span>
          <em>不计入现金支出</em>
        </span>
        <span class="wallet-detail-amount ${item.record.amount > 0 ? 'is-positive' : 'is-negative'}">
          <strong>${signedCurrencyAmount(item.record.amount, item.record.currency)}</strong>
          <span>调整</span>
        </span>
      </div>
    `;
  }

  function renderWalletDetail() {
    if (!els.walletDetailDialog || !els.walletDetailList) return;
    const { region, currency } = walletDetailState;
    const data = walletDetailData(region, currency);
    const topup = data.pointcards.reduce((sum, record) => sum + record.faceValue, 0);
    const spent = data.games
      .filter((record) => record.paymentMethod === 'balance')
      .reduce((sum, record) => sum + record.eshopPrice, 0);
    const adjustment = data.adjustments.reduce((sum, item) => sum + item.amount, 0);
    const balance = walletBalance(region, currency);
    const allItems = [
      ...data.pointcards.map((record) => ({ kind: 'pointcard', record })),
      ...data.games.map((record) => ({ kind: 'game', record })),
      ...data.adjustments.map((record) => ({ kind: 'adjustment', record }))
    ].sort((a, b) => {
      const aDate = a.kind === 'adjustment' ? String(a.record.createdAt || '') : String(a.record.purchaseDate || '');
      const bDate = b.kind === 'adjustment' ? String(b.record.createdAt || '') : String(b.record.purchaseDate || '');
      return bDate.localeCompare(aDate);
    });
    const counts = {
      all: allItems.length,
      pointcard: data.pointcards.length,
      game: data.games.length
    };

    els.walletDetailTitle.textContent = `${region} 余额明细`;
    els.walletDetailSub.textContent = `${currency} · 点卡、余额游戏、直购游戏与手动调整，按时间倒序。`;
    els.walletDetailRegion.textContent = region;
    els.walletDetailCurrency.textContent = currency;
    els.walletDetailBalance.textContent = formatCurrencyAmount(balance, currency);
    els.walletDetailBalance.classList.toggle('is-negative', balance < 0);
    els.walletDetailBreakdown.innerHTML = `
      <span>充值 <b class="is-positive">${signedCurrencyAmount(topup, currency)}</b></span>
      <span>余额游戏 <b class="${spent ? 'is-negative' : ''}">${spent ? `−${formatCurrencyAmount(spent, currency)}` : formatCurrencyAmount(0, currency)}</b></span>
      <span>手动调整 <b class="${adjustment === 0 ? '' : (adjustment > 0 ? 'is-positive' : 'is-negative')}">${signedCurrencyAmount(adjustment, currency)}</b></span>
    `;

    els.walletDetailTabs.forEach((button) => {
      const active = button.dataset.walletTab === walletDetailState.tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    els.walletDetailCountAll.textContent = String(counts.all);
    els.walletDetailCountPointcard.textContent = String(counts.pointcard);
    els.walletDetailCountGame.textContent = String(counts.game);

    let items = allItems;
    if (walletDetailState.tab === 'pointcard') {
      items = allItems.filter((item) => item.kind === 'pointcard');
    } else if (walletDetailState.tab === 'game') {
      items = allItems.filter((item) => item.kind === 'game');
    }
    if (!items.length) {
      const message = walletDetailState.tab === 'pointcard'
        ? '这个区服还没有点卡记录。'
        : (walletDetailState.tab === 'game' ? '这个区服还没有 eShop 游戏。' : '这个区服还没有点卡或游戏记录。');
      els.walletDetailList.innerHTML = `<div class="wallet-detail-empty">${message}</div>`;
      return;
    }
    els.walletDetailList.innerHTML = items.map(walletDetailRowMarkup).join('');
  }

  function openWalletDetail(region, currency) {
    if (!els.walletDetailDialog) return;
    walletDetailState = {
      region,
      currency,
      tab: walletDetailState.region === region && walletDetailState.currency === currency
        ? walletDetailState.tab
        : 'all'
    };
    renderWalletDetail();
    if (!els.walletDetailDialog.open) els.walletDetailDialog.showModal();
  }

  function closeWalletDetail() {
    if (els.walletDetailDialog && els.walletDetailDialog.open) els.walletDetailDialog.close();
  }

  function setWalletDetailTab(tab) {
    if (!['all', 'pointcard', 'game'].includes(tab)) return;
    walletDetailState.tab = tab;
    renderWalletDetail();
  }

  function ensureSelectOption(select, value, label) {
    if (!select || !value) return;
    if (Array.from(select.options).some((option) => option.value === value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label || value;
    select.appendChild(option);
  }

  function fillSelectOptions(select, values, placeholder, currentValue) {
    if (!select) return;
    const previous = currentValue == null ? select.value : currentValue;
    select.innerHTML = '';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);
    values.forEach((item) => {
      const value = typeof item === 'string' ? item : item.value;
      const label = typeof item === 'string' ? item : item.label;
      if (!value) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = previous && Array.from(select.options).some((option) => option.value === previous) ? previous : '';
  }

  function defaultRegionLabel() {
    const first = activeRegions()[0];
    return first ? first.label : (settings.regions[0] ? settings.regions[0].label : '其他');
  }

  function populateOptionSelects() {
    if (!els.purchasePlatform) return;
    const current = {
      purchase: els.purchasePlatform.value,
      sale: els.salePlatform.value,
      accessory: els.accessoryType.value,
      region: els.recordRegion.value,
      walletRegion: els.walletRegion.value,
      currency: els.recordCurrency.value,
      walletCurrency: els.walletCurrency.value
    };
    const platformLabels = activePlatforms().map((item) => item.label);
    const accessoryLabels = activeAccessoryTypes().map((item) => item.label);
    const regionLabels = activeRegions().map((item) => item.label);
    const currencies = allCurrencies();
    fillSelectOptions(els.purchasePlatform, platformLabels, '请选择平台', current.purchase);
    fillSelectOptions(els.salePlatform, platformLabels, '请选择平台', current.sale);
    fillSelectOptions(els.accessoryType, accessoryLabels, '选择配件类型', current.accessory);
    fillSelectOptions(els.recordRegion, regionLabels, '请选择区服', current.region);
    fillSelectOptions(els.walletRegion, regionLabels, '请选择区服', current.walletRegion);
    fillSelectOptions(els.recordCurrency, currencies, '请选择币种', current.currency);
    fillSelectOptions(els.walletCurrency, currencies, '请选择币种', current.walletCurrency);
  }

  function setCurrencyForRegion(regionSelect, currencySelect) {
    const region = regionSelect.value;
    const locked = isFixedCurrencyRegion(region);
    if (locked) currencySelect.value = defaultCurrencyForRegion(region);
    if (!currencySelect.value) currencySelect.value = defaultCurrencyForRegion(region);
    currencySelect.disabled = locked;
    currencySelect.setAttribute('aria-disabled', String(locked));
    currencySelect.title = locked
      ? `${region}固定使用 ${currencySelect.value}`
      : (region === '其他' ? '「其他」区服可自选币种' : '保留记录中的原币种');
    return currencySelect.value;
  }

  function updateWalletAmountStep() {
    els.walletAmount.step = currencyStep(els.walletCurrency.value);
  }

  function openWalletDialog(region = '', currency = '') {
    els.walletForm.reset();
    els.walletError.textContent = '';
    const regionLabel = String(region || '').trim() || defaultRegionLabel();
    ensureSelectOption(els.walletRegion, regionLabel);
    ensureSelectOption(els.walletCurrency, normalizeCurrencyCode(currency));
    const currencyCode = isFixedCurrencyRegion(regionLabel)
      ? defaultCurrencyForRegion(regionLabel)
      : (normalizeCurrencyCode(currency) || defaultCurrencyForRegion(regionLabel));
    ensureSelectOption(els.walletCurrency, currencyCode);
    els.walletRegion.value = regionLabel;
    els.walletCurrency.value = currencyCode;
    setCurrencyForRegion(els.walletRegion, els.walletCurrency);
    updateWalletAmountStep();
    els.walletAmount.value = '';
    els.walletNote.value = '';
    if (!els.walletDialog.open) els.walletDialog.showModal();
    window.setTimeout(() => els.walletAmount.focus(), 100);
  }

  function closeWalletDialog() {
    if (els.walletDialog.open) els.walletDialog.close();
  }

  function handleWalletSubmit(event) {
    event.preventDefault();
    const region = normalizeRegion(els.walletRegion.value) || '其他';
    const currency = effectiveCurrency(region, els.walletCurrency.value);
    if (!region || !currency) {
      els.walletError.textContent = '请选择区服和币种';
      return;
    }
    const amount = roundForCurrency(els.walletAmount.value, currency);
    if (!Number.isFinite(amount) || amount === 0) {
      els.walletError.textContent = '调整金额不能为 0，可填正数或负数';
      els.walletAmount.focus();
      return;
    }
    const adjustment = normalizeAdjustment({
      id: uid(),
      region,
      currency,
      amount,
      note: els.walletNote.value,
      createdAt: new Date().toISOString()
    });
    if (!adjustment) {
      els.walletError.textContent = '调整金额无效，请重试';
      return;
    }
    if (!commitState(records, [...balanceAdjustments, adjustment])) return;
    closeWalletDialog();
    render();
    showToast(`已调整 ${region} ${formatCurrencyAmount(adjustment.amount, currency)} 余额`);
  }

  function updateWalletHint() {
    const category = getSelectedCategory();
    if (category !== 'pointcard' && category !== 'eshop') {
      els.walletHint.hidden = true;
      return;
    }
    const region = els.recordRegion.value || defaultRegionLabel();
    const currency = effectiveCurrency(region, els.recordCurrency.value) || defaultCurrencyForRegion(region);
    const current = walletBalance(region, currency);
    const editingId = els.recordDialog.dataset.editingId;
    const existing = editingId ? records.find((record) => record.id === editingId) : null;
    const oldContribution = existing && existing.region === region && existing.currency === currency
      ? recordWalletContribution(existing)
      : 0;
    let next = current;
    let text = '';
    if (category === 'pointcard') {
      next = roundSigned(current - oldContribution + (Number(els.faceValue.value) || 0));
      text = `面值会自动充入 ${region} 余额：当前 ${formatCurrencyAmount(current, currency)}，保存后 ${formatCurrencyAmount(next, currency)}。`;
    } else if (els.paymentMethod.value === 'balance') {
      next = roundSigned(current - oldContribution - (Number(els.eshopPrice.value) || 0));
      text = `将从 ${region} 余额扣减：当前 ${formatCurrencyAmount(current, currency)}，保存后 ${formatCurrencyAmount(next, currency)}。`;
      if (next < 0) text += ' 余额不足，可先补充余额或稍后手动调整。';
    } else {
      text = `直购按实付人民币计入现金支出，不扣余额；${region} 当前余额 ${formatCurrencyAmount(current, currency)}。`;
    }
    els.walletHintText.textContent = text;
    els.walletHint.classList.toggle('is-negative', category === 'eshop' && els.paymentMethod.value === 'balance' && next < 0);
    els.walletHint.hidden = false;
  }

  function renderStorage() {
    const byteSize = new Blob([JSON.stringify({ records, adjustments: balanceAdjustments, settings })]).size;
    const sizeText = byteSize < 1024 ? `${byteSize} B` : `${(byteSize / 1024).toFixed(1)} KB`;
    const meta = getMeta();
    const lastBackup = meta.lastBackupAt || '';
    const lastChange = meta.lastChangeAt || records.reduce(
      (latest, record) => (record.updatedAt > latest ? record.updatedAt : latest),
      ''
    );
    const dirty = Boolean(lastBackup && lastChange && new Date(lastChange) > new Date(lastBackup));

    els.dataCount.textContent = `${records.length} 条记录`;
    els.dataSize.textContent = `本地存储 · ${sizeText}`;

    if (els.storageNote) {
      if (!records.length && !balanceAdjustments.length) {
        els.storageNote.textContent = '0 条记录 · 数据仅在本机';
      } else if (!lastBackup) {
        els.storageNote.textContent = `${records.length} 条记录 · 尚未备份`;
      } else if (dirty) {
        els.storageNote.textContent = `${records.length} 条记录 · 有未备份的更改`;
      } else {
        els.storageNote.textContent = `${records.length} 条记录 · 已备份 ${formatBackupDate(lastBackup)}`;
      }
    }
  }

  function renderStatsPage() {
    if (!els.statsEmpty || !els.statsContent) return;
    const hasRecords = records.length > 0;
    els.statsEmpty.hidden = hasRecords;
    els.statsContent.hidden = !hasRecords;
    renderCategoryBreakdown();
  }

  function renderCategoryBreakdown() {
    if (!els.categoryList) return;
    const groups = [
      { key: 'cartridge', label: '卡带', color: '#e60012' },
      { key: 'accessory', label: '配件', color: '#247554' },
      { key: 'pointcard', label: '点卡', color: '#b9822f' },
      { key: 'eshop', label: 'eShop', color: '#5a79b8' }
    ];
    const totals = new Map(groups.map((group) => [group.key, 0]));
    records.forEach((record) => {
      if (!totals.has(record.category)) return;
      totals.set(record.category, totals.get(record.category) + recordCashSpend(record));
    });
    const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
    els.categoryTotal.textContent = `¥${formatCompact(total)}`;
    if (!total) {
      els.categoryList.innerHTML = '<p class="platform-empty">暂时没有现金支出分类数据。</p>';
      return;
    }
    els.categoryList.innerHTML = groups.map((group) => {
      const amount = totals.get(group.key) || 0;
      const percent = total > 0 ? (amount / total) * 100 : 0;
      return `
        <div class="category-row" style="--dot:${group.color}">
          <div class="category-row-head">
            <span><i class="platform-dot" aria-hidden="true"></i>${group.label}</span>
            <b>¥${formatCompact(amount)}</b>
          </div>
          <div class="category-track"><i style="width:${Math.max(0, Math.min(100, percent))}%"></i></div>
          <span class="category-percent">${percent.toFixed(percent > 0 && percent < 10 ? 1 : 0)}%</span>
        </div>
      `;
    }).join('');
  }

  function usageCount(kind, label) {
    if (kind === 'platform') {
      return records.filter((record) => record.platform === label || record.salePlatform === label).length;
    }
    if (kind === 'accessory') {
      return records.filter((record) => record.category === 'accessory' && record.accessoryType === label).length;
    }
    if (kind === 'region') {
      return records.filter((record) => record.region === label).length +
        balanceAdjustments.filter((adjustment) => adjustment.region === label).length;
    }
    return 0;
  }

  function renderOptionList(container, kind, items) {
    if (!container) return;
    container.innerHTML = [...items].sort((a, b) => Number(b.active) - Number(a.active)).map((item) => {
      const protectedOption = isProtectedOption(kind, item.label);
      const used = usageCount(kind, item.label);
      const badges = [
        `<span class="option-badge">${item.builtin ? '内置' : '自定义'}</span>`,
        item.active ? '' : '<span class="option-badge is-off">已停用</span>',
        kind === 'region' ? `<span class="option-badge is-currency">${escapeHtml(item.currency)}</span>` : ''
      ].filter(Boolean).join('');
      const actions = [];
      if (!item.builtin) {
        actions.push(`<button class="option-action" type="button" data-action="rename">改名</button>`);
      }
      if (!protectedOption) {
        actions.push(`<button class="option-action" type="button" data-action="toggle">${item.active ? '停用' : '恢复'}</button>`);
      } else {
        actions.push('<span class="option-fixed">固定保留</span>');
      }
      if (!item.builtin) {
        actions.push(`<button class="option-action is-danger" type="button" data-action="delete"${used > 0 ? ' disabled title="使用中，不能删除"' : ''}>删除</button>`);
      }
      return `
        <div class="option-row" data-kind="${kind}" data-label="${escapeHtml(item.label)}">
          <div class="option-main">
            <div class="option-title"><strong>${escapeHtml(item.label)}</strong>${badges}</div>
            <span class="option-usage">使用中 ${used} 条</span>
          </div>
          <div class="option-actions">${actions.join('')}</div>
        </div>
      `;
    }).join('');
  }

  function setOptionKind(kind, options = {}) {
    const normalized = ['platform', 'accessory', 'region'].includes(kind) ? kind : '';
    activeOptionKind = normalized;
    els.optionTabs.forEach((button) => {
      const active = button.dataset.optionKind === normalized;
      button.classList.toggle('is-open', active);
      button.setAttribute('aria-expanded', String(active));
    });
    els.optionPanels.forEach((panel) => {
      panel.hidden = panel.dataset.optionPanel !== normalized;
    });
    if (options.focus) {
      const activeTab = els.optionTabs.find((button) => button.dataset.optionKind === normalized);
      if (activeTab) activeTab.focus();
    }
  }

  function renderSettings() {
    if (!els.themeChoices) return;
    els.themeChoices.forEach((button) => {
      const active = button.dataset.themeChoice === settings.theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (els.optionTabCounts.platform) els.optionTabCounts.platform.textContent = String(settings.platforms.length);
    if (els.optionTabCounts.accessory) els.optionTabCounts.accessory.textContent = String(settings.accessoryTypes.length);
    if (els.optionTabCounts.region) els.optionTabCounts.region.textContent = String(settings.regions.length);
    renderOptionList(els.platformSettingsList, 'platform', settings.platforms);
    renderOptionList(els.accessorySettingsList, 'accessory', settings.accessoryTypes);
    renderOptionList(els.regionSettingsList, 'region', settings.regions);
    setOptionKind(activeOptionKind);
    if (els.appVersion) els.appVersion.textContent = `v${APP_VERSION}`;
    if (els.settingsStorageNote) {
      const backup = getMeta().lastBackupAt;
      els.settingsStorageNote.textContent = `${records.length} 条记录 · ${balanceAdjustments.length} 条余额调整${backup ? ` · 上次备份 ${formatBackupDate(backup)}` : ' · 尚未备份'}`;
    }
  }

  function currentOptionItems(kind) {
    if (kind === 'platform') return settings.platforms;
    if (kind === 'accessory') return settings.accessoryTypes;
    return settings.regions;
  }

  function optionKindLabel(kind) {
    if (kind === 'platform') return '平台';
    if (kind === 'accessory') return '配件类型';
    return '区服';
  }

  async function handleOptionAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const row = button.closest('.option-row');
    if (!row) return;
    const kind = row.dataset.kind;
    const label = row.dataset.label;
    const items = currentOptionItems(kind);
    const item = items.find((entry) => entry.label === label);
    if (!item) return;

    if (button.dataset.action === 'toggle') {
      if (isProtectedOption(kind, label)) {
        showToast('「其他」选项必须保留', { type: 'error' });
        return;
      }
      const nextItems = items.map((entry) => entry.label === label ? { ...entry, active: !entry.active } : entry);
      const nextSettings = { ...settings, [kind === 'platform' ? 'platforms' : kind === 'accessory' ? 'accessoryTypes' : 'regions']: nextItems };
      if (saveSettings(nextSettings)) {
        showToast(item.active ? `已停用「${label}」` : `已恢复「${label}」`);
      }
      return;
    }

    if (button.dataset.action === 'rename') {
      if (item.builtin) return;
      const proposed = window.prompt(`新的${optionKindLabel(kind)}名称`, label);
      const nextLabel = String(proposed || '').trim().slice(0, 30);
      if (!nextLabel || nextLabel === label) return;
      if (items.some((entry) => entry.label === nextLabel)) {
        showToast('已有同名选项', { type: 'error' });
        return;
      }
      const used = usageCount(kind, label);
      const confirmed = await askConfirm({
        title: `确认改名「${label}」？`,
        message: used > 0
          ? `「${label}」将改为「${nextLabel}」，并级联更新 ${used} 条已使用数据${kind === 'region' ? '（含余额调整）' : ''}。`
          : `「${label}」将改为「${nextLabel}」。`,
        okLabel: '确认改名',
        danger: false
      });
      if (!confirmed) return;
      const nextItems = items.map((entry) => entry.label === label ? { ...entry, label: nextLabel } : entry);
      const nextSettings = { ...settings, [kind === 'platform' ? 'platforms' : kind === 'accessory' ? 'accessoryTypes' : 'regions']: nextItems };
      let nextRecords = records;
      let nextAdjustments = balanceAdjustments;
      if (kind === 'platform') {
        nextRecords = records.map((record) => {
          const next = { ...record };
          if (next.platform === label) next.platform = nextLabel;
          if (next.salePlatform === label) next.salePlatform = nextLabel;
          return next;
        });
      } else if (kind === 'accessory') {
        nextRecords = records.map((record) => record.accessoryType === label ? { ...record, accessoryType: nextLabel } : record);
      } else {
        nextRecords = records.map((record) => record.region === label ? { ...record, region: nextLabel } : record);
        nextAdjustments = balanceAdjustments.map((adjustment) => adjustment.region === label ? { ...adjustment, region: nextLabel } : adjustment);
      }
      if (!commitState(nextRecords, nextAdjustments, nextSettings)) return;
      applyTheme();
      populateOptionSelects();
      renderSettings();
      render();
      showToast(`已重命名为「${nextLabel}」`);
      return;
    }

    if (button.dataset.action === 'delete') {
      if (item.builtin || usageCount(kind, label) > 0) {
        showToast('使用中的选项不能删除，可先停用', { type: 'error' });
        return;
      }
      const confirmed = await askConfirm({
        title: `删除自定义${optionKindLabel(kind)}？`,
        message: `「${label}」没有使用中的记录，删除后不可恢复。`,
        okLabel: '删除',
        danger: true
      });
      if (!confirmed) return;
      const nextItems = items.filter((entry) => entry.label !== label);
      const nextSettings = { ...settings, [kind === 'platform' ? 'platforms' : kind === 'accessory' ? 'accessoryTypes' : 'regions']: nextItems };
      if (saveSettings(nextSettings)) showToast(`已删除「${label}」`);
    }
  }

  async function resetDefaultSettings() {
    const confirmed = await askConfirm({
      title: '恢复默认设置？',
      message: '只会重置主题和平台/配件类型/区服选项，不会删除任何记录或余额调整。',
      okLabel: '恢复默认',
      danger: false
    });
    if (!confirmed) return;
    if (saveSettings(createDefaultSettings())) showToast('已恢复默认设置');
  }

  function addPlatform() {
    const label = els.newPlatformLabel.value.trim().slice(0, 30);
    if (!label) return;
    if (settings.platforms.some((item) => item.label === label)) {
      showToast('已有同名平台', { type: 'error' });
      return;
    }
    const nextSettings = {
      ...settings,
      platforms: [...settings.platforms, { label, active: true, builtin: false, color: customPlatformColor(label) }]
    };
    if (saveSettings(nextSettings)) {
      els.newPlatformLabel.value = '';
      showToast(`已新增平台「${label}」`);
    }
  }

  function addAccessoryType() {
    const label = els.newAccessoryLabel.value.trim().slice(0, 30);
    if (!label) return;
    if (settings.accessoryTypes.some((item) => item.label === label)) {
      showToast('已有同名配件类型', { type: 'error' });
      return;
    }
    const nextSettings = {
      ...settings,
      accessoryTypes: [...settings.accessoryTypes, { label, active: true, builtin: false }]
    };
    if (saveSettings(nextSettings)) {
      els.newAccessoryLabel.value = '';
      showToast(`已新增配件类型「${label}」`);
    }
  }

  function addRegion() {
    const label = els.newRegionLabel.value.trim().slice(0, 30);
    const currency = normalizeCurrencyCode(els.newRegionCurrency.value);
    if (!label) return;
    if (!currency) {
      showToast('币种需为三位大写字母，例如 TWD', { type: 'error' });
      els.newRegionCurrency.focus();
      return;
    }
    if (settings.regions.some((item) => item.label === label)) {
      showToast('已有同名区服', { type: 'error' });
      return;
    }
    const nextSettings = {
      ...settings,
      regions: [...settings.regions, { label, currency, active: true, builtin: false }]
    };
    if (saveSettings(nextSettings)) {
      els.newRegionLabel.value = '';
      els.newRegionCurrency.value = '';
      showToast(`已新增区服「${label}」`);
    }
  }

  function setThemeChoice(theme) {
    if (!THEMES.includes(theme) || theme === settings.theme) return;
    const nextSettings = { ...settings, theme };
    if (saveSettings(nextSettings, { render: false })) {
      showToast(theme === 'system' ? '已切换为跟随系统' : (theme === 'dark' ? '已切换为深色' : '已切换为暖白'));
    }
  }

  function render() {
    if (!['physical', 'cartridge', 'accessory'].includes(ui.type)) {
      ui.filter = 'all';
    }
    const stats = computeStats();
    const visible = getVisibleRecords();
    renderOverview(stats);
    renderFilters(visible);
    renderRecords(visible);
    renderWallets();
    renderChart();
    renderPlatforms();
    renderStatsPage();
    renderSettings();
    renderStorage();
    if (els.walletDetailDialog && els.walletDetailDialog.open) renderWalletDetail();
  }

  function setFilter(filter) {
    if (!['all', 'owned', 'sold'].includes(filter)) return;
    ui.filter = filter;
    render();
  }

  function resetFilters() {
    ui.query = '';
    ui.filter = 'all';
    ui.type = 'all';
    els.searchInput.value = '';
    render();
  }

  function clearFormErrors() {
    els.formError.textContent = '';
    $$('.has-error', els.recordForm).forEach((field) => {
      field.classList.remove('has-error');
      field.removeAttribute('aria-invalid');
    });
  }

  function showFormErrors(problems) {
    clearFormErrors();
    els.formError.textContent = problems.map((problem) => problem.message).join('；');
    problems.forEach((problem) => {
      problem.field.classList.add('has-error');
      problem.field.setAttribute('aria-invalid', 'true');
      const selectWrap = problem.field.closest('.select-wrap');
      if (selectWrap) selectWrap.classList.add('has-error');
    });
    const first = problems[0];
    if (first) {
      first.field.focus();
      if (typeof first.field.scrollIntoView === 'function') {
        first.field.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }

  function toggleSoldFields() {
    const category = getSelectedCategory();
    const physical = isPhysicalCategory(category);
    if (!physical) els.soldToggle.checked = false;
    const sold = physical && els.soldToggle.checked;
    els.soldFields.hidden = !sold;
    els.soldToggle.setAttribute('aria-expanded', String(sold));
    if (sold) {
      if (!els.saleDate.value) els.saleDate.value = todayISO();
      if (!els.salePlatform.value) {
        const preferred = activePlatforms().find((item) => item.label === '闲鱼');
        const fallback = preferred || activePlatforms()[0];
        if (fallback) {
          ensureSelectOption(els.salePlatform, fallback.label);
          els.salePlatform.value = fallback.label;
        }
      }
    }
  }

  function getSelectedCategory() {
    const checked = els.categoryInputs.find((input) => input.checked);
    return checked ? checked.value : 'cartridge';
  }

  function syncCategoryUI(category) {
    const physical = isPhysicalCategory(category);
    const accessory = category === 'accessory';
    const pointcard = category === 'pointcard';
    const eshop = category === 'eshop';
    const editing = Boolean(els.recordDialog.dataset.editingId);

    if (pointcard || eshop) {
      if (!els.recordRegion.value) els.recordRegion.value = defaultRegionLabel();
      ensureSelectOption(els.recordRegion, els.recordRegion.value);
      ensureSelectOption(els.recordCurrency, els.recordCurrency.value);
      setCurrencyForRegion(els.recordRegion, els.recordCurrency);
      if (!els.recordCurrency.value) {
        els.recordCurrency.value = defaultCurrencyForRegion(els.recordRegion.value);
      }
    } else {
      setCurrencyForRegion(els.recordRegion, els.recordCurrency);
    }
    const currency = effectiveCurrency(els.recordRegion.value, els.recordCurrency.value) || 'HKD';
    els.faceValue.step = currencyStep(currency);
    els.eshopPrice.step = currencyStep(currency);

    els.nameLabel.textContent = eshop
      ? 'eShop 游戏名称'
      : (pointcard ? '点卡名称' : (accessory ? '配件名称' : '游戏名称'));
    els.gameTitle.placeholder = eshop
      ? '例如：塞尔达传说 王国之泪'
      : (pointcard
        ? '例如：任天堂 eShop 500 港币点卡'
        : (accessory ? '例如：Switch Pro 手柄' : '例如：塞尔达传说 王国之泪'));
    els.editionLabel.textContent = accessory ? '规格 / 型号' : '版本 / 区域';
    els.edition.placeholder = accessory ? 'OLED 款 / 国行 / 黑色' : '港版 / 日版 / 国行';

    els.purchasePlatformField.hidden = eshop;
    els.editionField.hidden = !physical;
    els.regionField.hidden = !(pointcard || eshop);
    els.currencyField.hidden = !(pointcard || eshop);
    els.faceValueField.hidden = !pointcard;
    els.eshopPriceField.hidden = !eshop;
    els.paymentMethodField.hidden = !eshop;
    els.conditionField.hidden = !physical;
    els.accessoryTypeField.hidden = !accessory;
    els.accessoryType.required = accessory;
    els.soldToggleField.hidden = !physical;

    const directEshop = eshop && els.paymentMethod.value === 'direct';
    const showPrice = !eshop || directEshop;
    els.purchasePriceField.hidden = !showPrice;
    els.purchasePrice.required = showPrice;
    els.purchasePriceLabel.textContent = eshop ? '实付人民币' : '购入价格';
    els.faceValueCurrency.textContent = currencyPrefix(currency);
    els.eshopPriceCurrency.textContent = currencyPrefix(currency);

    els.soldToggleTitle.textContent = '已经出二手了吗？';
    els.soldToggleHint.textContent = '开启后可记录售出价格，自动折算这件物品的净成本。';
    els.saleDateLabel.textContent = '售出日期';

    const labels = {
      cartridge: { edit: '编辑卡带记录', create: '记录一张卡带' },
      accessory: { edit: '编辑配件记录', create: '记录一件配件' },
      pointcard: { edit: '编辑点卡记录', create: '记录一张点卡' },
      eshop: { edit: '编辑 eShop 游戏', create: '记录一款 eShop 游戏' }
    };
    els.recordDialogTitle.textContent = editing ? labels[category].edit : labels[category].create;
    els.recordDialog.dataset.category = category;
    toggleSoldFields();
    updateWalletHint();
  }

  function setFormCategory(category) {
    const normalized = ['accessory', 'pointcard', 'eshop'].includes(category) ? category : 'cartridge';
    els.categoryInputs.forEach((input) => {
      input.checked = input.value === normalized;
    });
    syncCategoryUI(normalized);
  }

  function openRecordDialog(record = null, presetCategory = null, presetRegion = null) {
    const editing = Boolean(record);
    els.recordForm.reset();
    clearFormErrors();
    els.soldFields.hidden = true;
    els.soldToggle.checked = false;
    els.soldToggle.setAttribute('aria-expanded', 'false');
    els.recordDialog.dataset.editingId = record ? record.id : '';

    const initialCategory = record
      ? record.category
      : (presetCategory || getMeta().lastCategory || 'cartridge');
    setFormCategory(initialCategory);
    els.recordDialogSub.textContent = editing
      ? '修改购入、余额或二手信息，保存后统计会自动更新。'
      : '卡带、配件、点卡和 eShop 游戏都能记；余额购游戏会从对应区服余额扣减。';

    if (editing) {
      els.recordDialogKicker.textContent = 'EDIT ENTRY';
      els.saveRecord.textContent = '保存修改';
      els.gameTitle.value = record.title;
      ensureSelectOption(els.purchasePlatform, record.platform);
      ensureSelectOption(els.recordRegion, record.region);
      ensureSelectOption(els.recordCurrency, record.currency);
      ensureSelectOption(els.accessoryType, record.accessoryType);
      ensureSelectOption(els.salePlatform, record.salePlatform);
      els.purchasePlatform.value = record.platform;
      els.recordRegion.value = record.region || defaultRegionLabel();
      els.recordCurrency.value = record.currency || defaultCurrencyForRegion(els.recordRegion.value);
      els.edition.value = record.edition;
      els.faceValue.value = record.category === 'pointcard' ? String(record.faceValue || '') : '';
      els.eshopPrice.value = record.category === 'eshop' ? String(record.eshopPrice || '') : '';
      els.paymentMethod.value = record.paymentMethod || 'balance';
      els.purchasePrice.value = String(record.purchasePrice ?? '');
      els.purchaseDate.value = record.purchaseDate;
      els.condition.value = record.condition;
      els.accessoryType.value = record.category === 'accessory' ? record.accessoryType : '';
      els.soldToggle.checked = record.sold;
      els.salePrice.value = record.sold ? String(record.salePrice) : '';
      els.saleDate.value = record.sold ? record.saleDate : '';
      els.salePlatform.value = record.sold ? record.salePlatform : '';
      els.note.value = record.note;
      syncCategoryUI(initialCategory);
    } else {
      const initialRegion = presetRegion && findRegionSetting(presetRegion)?.active
        ? presetRegion
        : defaultRegionLabel();
      els.recordDialogKicker.textContent = 'NEW ENTRY';
      els.saveRecord.textContent = '保存记录';
      els.purchaseDate.value = todayISO();
      els.recordRegion.value = initialRegion;
      els.recordCurrency.value = defaultCurrencyForRegion(initialRegion);
      els.paymentMethod.value = 'balance';
      syncCategoryUI(initialCategory);
    }

    if (!els.recordDialog.open) els.recordDialog.showModal();
    window.setTimeout(() => {
      if (!editing) els.gameTitle.focus();
    }, 100);
  }

  function closeRecordDialog() {
    if (els.recordDialog.open) els.recordDialog.close();
  }

  function validateRecordForm() {
    const problems = [];
    const category = getSelectedCategory();
    const physical = isPhysicalCategory(category);
    const pointcard = category === 'pointcard';
    const eshop = category === 'eshop';
    const title = els.gameTitle.value.trim();
    const accessoryType = els.accessoryType.value;
    const platform = els.purchasePlatform.value;
    const region = els.recordRegion.value;
    const currency = (pointcard || eshop) ? effectiveCurrency(region, els.recordCurrency.value) : '';
    const faceValue = els.faceValue.value.trim();
    const eshopPrice = els.eshopPrice.value.trim();
    const paymentMethod = els.paymentMethod.value;
    const purchasePrice = els.purchasePrice.value.trim();
    const purchaseDate = els.purchaseDate.value;
    const sold = physical && els.soldToggle.checked;
    const salePrice = els.salePrice.value.trim();
    const saleDate = els.saleDate.value;
    const salePlatform = els.salePlatform.value;

    if (!title) {
      problems.push({
        field: els.gameTitle,
        message: eshop
          ? '请填写 eShop 游戏名称'
          : (pointcard ? '请填写点卡名称' : (category === 'accessory' ? '请填写配件名称' : '请填写游戏名称'))
      });
    }
    if (category === 'accessory' && !accessoryType) {
      problems.push({ field: els.accessoryType, message: '请选择配件类型' });
    }
    if (!eshop && !platform) {
      problems.push({ field: els.purchasePlatform, message: '请选择购入平台' });
    }
    if (pointcard || eshop) {
      if (!region) problems.push({ field: els.recordRegion, message: '请选择区服' });
      if (!currency) problems.push({ field: els.recordCurrency, message: '请选择币种' });
    }
    if (pointcard) {
      if (faceValue === '') {
        problems.push({ field: els.faceValue, message: '请填写点卡面值' });
      } else {
        const value = Number(faceValue);
        if (!Number.isFinite(value) || value <= 0) {
          problems.push({ field: els.faceValue, message: '点卡面值需大于 0' });
        }
      }
    }
    if (eshop) {
      if (eshopPrice === '') {
        problems.push({ field: els.eshopPrice, message: '请填写 eShop 标价' });
      } else {
        const value = Number(eshopPrice);
        if (!Number.isFinite(value) || value < 0) {
          problems.push({ field: els.eshopPrice, message: 'eShop 标价需大于等于 0' });
        }
      }
    }
    const needsPrice = physical || pointcard || (eshop && paymentMethod === 'direct');
    if (needsPrice) {
      if (purchasePrice === '') {
        problems.push({
          field: els.purchasePrice,
          message: eshop ? '请填写实付人民币' : '请填写购入价格'
        });
      } else {
        const number = Number(purchasePrice);
        if (!Number.isFinite(number) || number < 0 || number > 999999) {
          problems.push({ field: els.purchasePrice, message: '金额需在 0–999999 之间' });
        }
      }
    }
    if (!purchaseDate || !isValidDateString(purchaseDate)) {
      problems.push({ field: els.purchaseDate, message: '请选择购入日期' });
    }

    if (physical && sold) {
      if (salePrice === '') {
        problems.push({ field: els.salePrice, message: '已出二手时请填写售出价格' });
      } else {
        const number = Number(salePrice);
        if (!Number.isFinite(number) || number < 0 || number > 999999) {
          problems.push({ field: els.salePrice, message: '售出价格需在 0–999999 之间' });
        }
      }
      if (!saleDate || !isValidDateString(saleDate)) {
        problems.push({ field: els.saleDate, message: '请选择售出日期' });
      } else if (purchaseDate && saleDate < purchaseDate) {
        problems.push({ field: els.saleDate, message: '售出日期不能早于购入日期' });
      }
      if (!salePlatform) {
        problems.push({ field: els.salePlatform, message: '请选择出售平台' });
      }
    }

    return {
      problems,
      category,
      physical,
      pointcard,
      eshop,
      title,
      accessoryType,
      platform,
      region,
      currency,
      faceValue,
      eshopPrice,
      paymentMethod,
      purchasePrice,
      purchaseDate,
      sold,
      salePrice,
      saleDate,
      salePlatform
    };
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    const values = validateRecordForm();
    if (values.problems.length) {
      showFormErrors(values.problems);
      return;
    }

    const editingId = els.recordDialog.dataset.editingId;
    const existing = editingId ? records.find((record) => record.id === editingId) : null;
    const now = new Date().toISOString();
    const nextRecord = normalizeRecord({
      id: existing ? existing.id : uid(),
      title: values.title,
      category: values.category,
      accessoryType: values.category === 'accessory' ? values.accessoryType : '',
      platform: values.eshop ? 'eShop' : values.platform,
      edition: values.physical ? els.edition.value : '',
      region: values.pointcard || values.eshop ? values.region : '',
      currency: values.pointcard || values.eshop ? values.currency : '',
      faceValue: values.pointcard ? values.faceValue : 0,
      eshopPrice: values.eshop ? values.eshopPrice : 0,
      paymentMethod: values.eshop ? values.paymentMethod : '',
      purchasePrice: values.eshop && values.paymentMethod === 'balance' ? 0 : values.purchasePrice,
      purchaseDate: values.purchaseDate,
      condition: values.physical ? els.condition.value : '全新',
      sold: values.physical ? values.sold : false,
      salePrice: values.physical && values.sold ? values.salePrice : 0,
      saleDate: values.physical && values.sold ? values.saleDate : '',
      salePlatform: values.physical && values.sold ? values.salePlatform : '',
      note: els.note.value,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    });

    if (!nextRecord) {
      showFormErrors([{ field: els.gameTitle, message: '记录内容有误，请检查后重试' }]);
      return;
    }

    let negativeBalance = false;
    if (nextRecord.category === 'eshop' && nextRecord.paymentMethod === 'balance') {
      const currentBalance = walletBalance(nextRecord.region, nextRecord.currency);
      const oldContribution = existing &&
        existing.region === nextRecord.region &&
        existing.currency === nextRecord.currency
        ? recordWalletContribution(existing)
        : 0;
      const projectedBalance = roundSigned(currentBalance - oldContribution - nextRecord.eshopPrice);
      if (projectedBalance < 0) {
        const confirmed = await askConfirm({
          title: '余额不足，仍要保存？',
          message: `${nextRecord.region} ${nextRecord.currency} 当前余额 ${formatCurrencyAmount(currentBalance, nextRecord.currency)}，保存后为 ${formatCurrencyAmount(projectedBalance, nextRecord.currency)}。可补记点卡或调整余额。`,
          okLabel: '仍然保存',
          danger: true
        });
        if (!confirmed) {
          els.saveRecord.focus();
          return;
        }
        negativeBalance = true;
      }
    }

    const nextRecords = existing
      ? records.map((record) => (record.id === existing.id ? nextRecord : record))
      : [nextRecord, ...records];
    if (!commitState(nextRecords, balanceAdjustments)) return;

    setMeta({ lastCategory: values.category });
    ui.query = '';
    ui.filter = 'all';
    ui.type = 'all';
    els.searchInput.value = '';
    closeRecordDialog();
    render();
    const message = existing
      ? '记录已更新'
      : (values.category === 'pointcard'
        ? '已记下这张点卡'
        : (values.category === 'eshop'
          ? '已记下这款 eShop 游戏'
          : (values.category === 'accessory' ? '已记下这件配件' : '已记下这张卡带')));
    showToast(
      negativeBalance ? `${message}；余额为负，可补记点卡或调整余额` : message,
      negativeBalance ? { duration: 5600 } : undefined
    );
  }

  function askConfirm({ title, message, okLabel = '确认', danger = true }) {
    return new Promise((resolve) => {
      if (confirmResolver) {
        confirmResolver(false);
        confirmResolver = null;
      }
      els.confirmTitle.textContent = title;
      els.confirmMessage.textContent = message;
      els.confirmOk.textContent = okLabel;
      els.confirmOk.classList.toggle('btn-danger', danger);
      els.confirmOk.classList.toggle('btn-primary', !danger);
      confirmResolver = resolve;
      if (!els.confirmDialog.open) els.confirmDialog.showModal();
    });
  }

  function settleConfirm(result) {
    const resolve = confirmResolver;
    confirmResolver = null;
    if (els.confirmDialog.open) els.confirmDialog.close();
    if (resolve) resolve(result);
  }

  async function deleteRecord(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return;
    const confirmed = await askConfirm({
      title: '删除这件物品？',
      message: `「${record.title}」的购入、余额或售出记录会一起删除，且无法恢复。`,
      okLabel: '删除',
      danger: true
    });
    if (!confirmed) return;

    if (!commitState(records.filter((item) => item.id !== id), balanceAdjustments)) return;
    render();
    showToast('记录已删除');
  }

  function openDataDialog() {
    renderStorage();
    els.dataError.textContent = '';
    els.dataError.hidden = true;
    if (!els.dataDialog.open) els.dataDialog.showModal();
  }

  function closeDataDialog() {
    if (els.dataDialog.open) els.dataDialog.close();
  }

  function showDataError(message) {
    els.dataError.textContent = message;
    els.dataError.hidden = false;
    showToast(message, { type: 'error', duration: 5200 });
  }

  function markBackedUp() {
    const now = new Date().toISOString();
    setMeta({ lastBackupAt: now, lastChangeAt: now });
    renderStorage();
    renderSettings();
  }

  function downloadBlob(content, type, filename) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1800);
  }

  function exportJson() {
    const payload = {
      app: APP_ID,
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      records,
      adjustments: balanceAdjustments,
      settings
    };
    downloadBlob(
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8',
      `switch-cart-ledger-${todayISO()}.json`
    );
    markBackedUp();
    showToast(`已导出 ${records.length} 条记录、${balanceAdjustments.length} 条余额调整和设置`);
  }

  function csvCell(value) {
    let text = String(value == null ? '' : value);
    if (typeof value !== 'number' && /^[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    if (!records.length) {
      showToast('还没有记录可以导出', { type: 'error' });
      return;
    }
    const headers = [
      '物品类型', '配件类型', '名称', '购入平台', '区服', '币种', '版本/规格',
      '面值', 'eShop 标价', '支付方式', '实付人民币', '购入日期', '购入成色',
      '状态', '售出价格', '售出日期', '出售平台', '备注'
    ];
    const rows = records.map((record) => {
      const pointcard = record.category === 'pointcard';
      const eshop = record.category === 'eshop';
      const physical = isPhysicalCategory(record.category);
      const typeLabel = pointcard
        ? '点卡'
        : (eshop ? 'eShop 游戏' : (record.category === 'accessory' ? '配件' : '卡带'));
      const statusLabel = physical
        ? (record.sold ? '已出' : '在库')
        : (pointcard ? '充值' : '已购');
      return [
        typeLabel,
        record.category === 'accessory' ? record.accessoryType : '',
        record.title,
        record.platform,
        record.region,
        record.currency,
        record.edition,
        pointcard ? record.faceValue : '',
        eshop ? record.eshopPrice : '',
        eshop ? (record.paymentMethod === 'direct' ? '直购' : '余额支付') : '',
        recordCashSpend(record),
        record.purchaseDate,
        physical ? record.condition : '',
        statusLabel,
        physical && record.sold ? record.salePrice : '',
        physical && record.sold ? record.saleDate : '',
        physical && record.sold ? record.salePlatform : '',
        record.note
      ];
    });
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    downloadBlob(csv, 'text/csv;charset=utf-8', `switch-cart-ledger-${todayISO()}.csv`);
    showToast('表格已导出，可用 Excel 打开');
  }

  function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showDataError('备份文件过大，无法导入');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const objectBackup = parsed && typeof parsed === 'object' && !Array.isArray(parsed);
        if (objectBackup) {
          if (parsed.app && parsed.app !== APP_ID) {
            showDataError('导入失败：这不是本应用的备份');
            return;
          }
          const backupVersion = Number(parsed.version);
          if (Number.isFinite(backupVersion) && backupVersion > APP_VERSION) {
            showDataError('导入失败：备份来自较新版本，请更新应用后再试');
            return;
          }
        }
        const list = Array.isArray(parsed) ? parsed : (parsed && parsed.records);
        if (!Array.isArray(list)) throw new Error('备份格式不正确');
        const normalizeImported = (raw) => {
          const record = normalizeRecord(raw);
          if (!record) return null;
          if (raw && typeof raw === 'object' && !raw.updatedAt) {
            const fallbackDate = normalizeDate(String(raw.createdAt || '').slice(0, 10)) || record.purchaseDate;
            if (fallbackDate) record.updatedAt = `${fallbackDate}T00:00:00.000Z`;
          }
          return record;
        };
        const incoming = list.map(normalizeImported).filter(Boolean);
        const incomingAdjustments = Array.isArray(parsed && parsed.adjustments)
          ? parsed.adjustments.map(normalizeAdjustment).filter(Boolean)
          : [];
        if (!incoming.length && !incomingAdjustments.length) {
          throw new Error('备份中没有可导入的记录');
        }

        const nextRecords = records.slice();
        const nextAdjustments = balanceAdjustments.slice();
        let added = 0;
        let updated = 0;
        let adjustmentsAdded = 0;
        incoming.forEach((record) => {
          const index = nextRecords.findIndex((item) => item.id === record.id);
          if (index === -1) {
            nextRecords.push(record);
            added += 1;
          } else {
            const oldTime = Date.parse(nextRecords[index].updatedAt || '') || 0;
            const newTime = Date.parse(record.updatedAt || '') || 0;
            if (newTime > oldTime) {
              nextRecords[index] = record;
              updated += 1;
            }
          }
        });
        incomingAdjustments.forEach((adjustment) => {
          if (!nextAdjustments.some((item) => item.id === adjustment.id)) {
            nextAdjustments.push(adjustment);
            adjustmentsAdded += 1;
          }
        });

        if (!added && !updated && !adjustmentsAdded) {
          showDataError('没有发现需要导入的新内容');
          return;
        }
        if (!commitState(nextRecords, nextAdjustments)) return;
        closeDataDialog();
        render();
        showToast(`导入完成：新增 ${added} 条、更新 ${updated} 条、余额调整 ${adjustmentsAdded} 条`);
      } catch (error) {
        console.warn('导入失败', error);
        showDataError('导入失败：请选择由本应用导出的 JSON 备份');
      }
    };
    reader.onerror = () => showDataError('读取备份文件失败，请重试');
    reader.readAsText(file, 'utf-8');
  }

  async function resetAllRecords() {
    if (!records.length && !balanceAdjustments.length) {
      showToast('账本已经是空的', { type: 'error' });
      return;
    }
    const confirmed = await askConfirm({
      title: '清空账本？',
      message: `当前 ${records.length} 条记录和余额调整都会被删除，主题与选项设置会保留。建议先导出完整备份。`,
      okLabel: '全部清空',
      danger: true
    });
    if (!confirmed) return;
    if (!commitState([], [], settings)) return;
    ui = { filter: 'all', type: 'all', query: '', sort: ui.sort };
    els.searchInput.value = '';
    closeDataDialog();
    render();
    showToast('账本已清空，设置已保留');
  }

  function handleRestoreFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showDataError('备份文件过大，无法恢复');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      let previousSettings = settings;
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const objectBackup = parsed && typeof parsed === 'object' && !Array.isArray(parsed);
        if (objectBackup) {
          if (parsed.app && parsed.app !== APP_ID) {
            showDataError('恢复失败：这不是本应用的备份');
            return;
          }
          const backupVersion = Number(parsed.version);
          if (Number.isFinite(backupVersion) && backupVersion > APP_VERSION) {
            showDataError('恢复失败：备份来自较新版本，请更新应用后再试');
            return;
          }
        }
        const list = Array.isArray(parsed) ? parsed : (parsed && parsed.records);
        if (!Array.isArray(list)) throw new Error('备份格式不正确');
        const backupSettings = objectBackup && parsed.settings
          ? normalizeSettings(parsed.settings)
          : createDefaultSettings();
        settings = backupSettings;
        const nextRecords = list.map(normalizeRecord).filter(Boolean);
        const nextAdjustments = Array.isArray(parsed && parsed.adjustments)
          ? parsed.adjustments.map(normalizeAdjustment).filter(Boolean)
          : [];
        settings = previousSettings;

        const confirmed = await askConfirm({
          title: '覆盖恢复全部数据？',
          message: `将用备份替换当前 ${records.length} 条记录、${balanceAdjustments.length} 条余额调整和全部设置（备份含 ${nextRecords.length} 条记录、${nextAdjustments.length} 条调整）。此操作无法撤销。`,
          okLabel: '覆盖恢复',
          danger: true
        });
        if (!confirmed) return;
        if (!commitState(nextRecords, nextAdjustments, backupSettings)) return;
        applyTheme();
        populateOptionSelects();
        closeDataDialog();
        renderSettings();
        render();
        showToast('已恢复全部数据与设置');
      } catch (error) {
        settings = previousSettings;
        console.warn('恢复失败', error);
        showDataError('恢复失败：请选择由本应用导出的 JSON 备份');
      }
    };
    reader.onerror = () => showDataError('读取备份文件失败，请重试');
    reader.readAsText(file, 'utf-8');
  }

  async function checkForUpdate() {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
      showToast('当前环境不支持离线缓存更新', { type: 'error' });
      return;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        showToast('缓存尚未就绪，请刷新页面后重试');
        return;
      }
      await registration.update();
      if (registration.waiting) {
        showToast('新版本已下载，刷新后使用', {
          actionLabel: '刷新',
          duration: 15000,
          onAction: () => {
            refreshingForUpdate = true;
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      } else {
        showToast('已检查更新，当前已是最新版本');
      }
    } catch (error) {
      console.warn('检查更新失败', error);
      showToast('检查更新失败，请稍后重试', { type: 'error' });
    }
  }

  function setInstallSteps(steps) {
    els.installSteps.innerHTML = steps.map((step, index) => `
      <li>
        <span class="install-step-num">${index + 1}</span>
        <div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.text)}</p></div>
      </li>
    `).join('');
  }

  function openInstallGuide() {
    const standalone = isStandalone();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isFile = window.location.protocol === 'file:';
    const hasPrompt = Boolean(deferredInstallPrompt) && !standalone;

    els.installPromptBtn.hidden = !hasPrompt;
    els.installNote.innerHTML = '';

    if (standalone) {
      els.installSub.textContent = '当前已经从桌面独立窗口打开，账本数据仍保存在本机。';
      setInstallSteps([
        { title: '已经在独立窗口运行', text: '不需要重复安装，直接继续记账即可。' },
        { title: '记得定期备份', text: '在「数据与备份」里导出 JSON，换设备时可以恢复。' }
      ]);
      els.installNote.textContent = '安装状态由浏览器管理，清理浏览器数据会同时删除账本，请务必保留备份。';
    } else if (isIOS) {
      els.installSub.textContent = 'iPhone / iPad 需要通过 Safari 的分享菜单添加到主屏幕。';
      setInstallSteps([
        { title: '用 Safari 打开此页面', text: isFile ? '当前是本地文件，请先通过 HTTPS 或 localhost 访问。' : '如果从其他 App 内打开，请点右上角选择「在 Safari 中打开」。' },
        { title: '点击「分享」按钮', text: '在 Safari 底部工具栏找到分享图标。' },
        { title: '选择「添加到主屏幕」', text: '确认名称后点「添加」，桌面就会出现 Switch 账本图标。' }
      ]);
      els.installNote.textContent = 'iOS 不会显示自动安装弹窗，添加到主屏幕后即可全屏打开。记录仍保存在 Safari 的本地存储中。';
    } else {
      els.installSub.textContent = '安装后可像 App 一样从桌面打开，断网也能继续记账。';
      setInstallSteps([
        { title: '用 Chrome 或 Edge 打开', text: isFile ? '当前是本地文件，请先通过 HTTPS 或 localhost 访问。' : '保持当前页面打开，使用支持 PWA 的浏览器。' },
        { title: '找到安装入口', text: '点地址栏右侧的安装图标，或打开浏览器菜单选择「安装应用 / 添加到主屏幕」。' },
        { title: '确认安装', text: '安装完成后从桌面图标打开，屏幕更干净，也能离线使用。' }
      ]);
      if (isFile) {
        els.installNote.textContent = '本地文件方式（file://）无法注册 Service Worker。请通过 HTTPS 或 localhost 访问此页面后再安装。';
      } else if (hasPrompt) {
        els.installNote.textContent = '浏览器已检测到可安装版本，点下方「立即安装」即可。';
      } else {
        els.installNote.textContent = '如果地址栏没有安装图标，可尝试刷新页面，或确认当前地址是 HTTPS / localhost。';
      }
    }

    if (!els.installDialog.open) els.installDialog.showModal();
  }

  async function promptInstall() {
    if (isStandalone()) {
      showToast('已经在独立窗口运行');
      return;
    }
    if (!deferredInstallPrompt) {
      openInstallGuide();
      return;
    }
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        showToast('正在安装到桌面…');
      } else {
        showToast('已取消安装', { type: 'error' });
      }
    } catch (error) {
      console.warn('安装提示失败', error);
      openInstallGuide();
    }
  }

  function showToast(message, options = {}) {
    const { type = 'success', actionLabel = '', onAction = null, duration = 3400 } = options;
    window.clearTimeout(toastTimer);
    toastActionHandler = onAction;
    els.toastMessage.textContent = message;
    els.toastIcon.classList.toggle('is-error', type === 'error');
    els.toastIcon.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#${type === 'error' ? 'i-alert' : 'i-check'}"></use></svg>`;

    if (actionLabel && typeof onAction === 'function') {
      els.toastAction.hidden = false;
      els.toastAction.textContent = actionLabel;
    } else {
      els.toastAction.hidden = true;
      els.toastAction.textContent = '';
    }

    els.toast.classList.add('is-visible');
    if (duration > 0) {
      toastTimer = window.setTimeout(hideToast, duration);
    }
  }

  function hideToast() {
    window.clearTimeout(toastTimer);
    els.toast.classList.remove('is-visible');
    toastActionHandler = null;
  }

  function handleInstallState() {
    const standalone = isStandalone();
    if (standalone) {
      const label = els.installSideBtn.querySelector('span');
      if (label) label.textContent = '已安装到桌面';
      els.installSideBtn.disabled = true;
      els.installSideBtn.setAttribute('aria-disabled', 'true');
    }
  }

  function newRecordCategory() {
    if (ui.type === 'physical') return 'cartridge';
    return ['cartridge', 'accessory', 'pointcard', 'eshop'].includes(ui.type) ? ui.type : null;
  }

  function bindEvents() {
    els.addBtn.addEventListener('click', () => openRecordDialog(null, newRecordCategory()));
    els.emptyAction.addEventListener('click', () => {
      const mode = els.emptyAction.dataset.mode;
      if (mode === 'reset') {
        ui.query = '';
        els.searchInput.value = '';
        render();
        els.searchInput.focus();
      } else if (mode === 'clear-filter') {
        resetFilters();
      } else if (mode === 'add-accessory') {
        openRecordDialog(null, 'accessory');
      } else if (mode === 'add-pointcard') {
        openRecordDialog(null, 'pointcard');
      } else if (mode === 'add-eshop') {
        openRecordDialog(null, 'eshop');
      } else if (mode === 'add-cartridge') {
        openRecordDialog(null, 'cartridge');
      } else {
        openRecordDialog(null, newRecordCategory());
      }
    });

    $$('button', els.statusFilterGroup).forEach((button) => {
      button.addEventListener('click', () => setFilter(button.dataset.filter));
    });

    els.searchInput.addEventListener('input', () => {
      ui.query = els.searchInput.value.trim();
      render();
    });
    els.searchInput.addEventListener('search', () => {
      ui.query = els.searchInput.value.trim();
      render();
    });
    els.clearSearch.addEventListener('click', () => {
      ui.query = '';
      els.searchInput.value = '';
      render();
      els.searchInput.focus();
    });
    els.sortSelect.addEventListener('change', () => {
      ui.sort = els.sortSelect.value;
      render();
    });
    els.typeChips.forEach((button) => {
      button.addEventListener('click', () => setTypeFilter(button.dataset.type));
    });
    els.statsToggle.addEventListener('click', () => {
      setStatsExpanded(!els.statsGrid.classList.contains('is-expanded'), { persist: true });
    });

    els.recordList.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      const card = actionButton.closest('.record-card');
      if (!card) return;
      const id = card.dataset.id;
      if (actionButton.dataset.action === 'edit') {
        const record = records.find((item) => item.id === id);
        if (record) openRecordDialog(record);
      } else if (actionButton.dataset.action === 'delete') {
        deleteRecord(id);
      }
    });

    els.recordForm.addEventListener('submit', handleFormSubmit);
    els.categoryInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) syncCategoryUI(input.value);
      });
    });
    els.recordRegion.addEventListener('change', () => {
      setCurrencyForRegion(els.recordRegion, els.recordCurrency);
      syncCategoryUI(getSelectedCategory());
    });
    els.recordCurrency.addEventListener('change', () => {
      syncCategoryUI(getSelectedCategory());
    });
    els.paymentMethod.addEventListener('change', () => {
      syncCategoryUI(getSelectedCategory());
    });
    els.faceValue.addEventListener('input', updateWalletHint);
    els.eshopPrice.addEventListener('input', updateWalletHint);
    els.soldToggle.addEventListener('change', toggleSoldFields);
    els.closeRecord.addEventListener('click', closeRecordDialog);
    els.cancelRecord.addEventListener('click', closeRecordDialog);
    els.recordDialog.addEventListener('click', (event) => {
      if (event.target === els.recordDialog) closeRecordDialog();
    });
    els.recordDialog.addEventListener('close', () => {
      clearFormErrors();
      els.recordDialog.dataset.editingId = '';
    });
    const clearErrorOnEdit = (event) => {
      const target = event.target;
      if (target && target.classList) {
        target.classList.remove('has-error');
        target.removeAttribute('aria-invalid');
        const selectWrap = target.closest('.select-wrap');
        if (selectWrap) selectWrap.classList.remove('has-error');
      }
      if (els.formError.textContent) els.formError.textContent = '';
    };
    els.recordForm.addEventListener('input', clearErrorOnEdit);
    els.recordForm.addEventListener('change', clearErrorOnEdit);

    els.openDataBtn.addEventListener('click', openDataDialog);
    els.closeData.addEventListener('click', closeDataDialog);
    els.closeDataFoot.addEventListener('click', closeDataDialog);
    els.dataDialog.addEventListener('click', (event) => {
      if (event.target === els.dataDialog) closeDataDialog();
    });

    els.exportJsonBtn.addEventListener('click', exportJson);
    els.exportCsvBtn.addEventListener('click', exportCsv);
    els.importBtn.addEventListener('click', () => {
      els.fileInput.value = '';
      els.fileInput.click();
    });
    els.fileInput.addEventListener('change', handleImportFile);
    els.resetBtn.addEventListener('click', resetAllRecords);
    els.restoreAllBtn.addEventListener('click', () => {
      els.restoreInput.value = '';
      els.restoreInput.click();
    });
    els.restoreInput.addEventListener('change', handleRestoreFile);

    els.themeChoices.forEach((button) => {
      button.addEventListener('click', () => setThemeChoice(button.dataset.themeChoice));
    });
    els.optionTabs.forEach((button) => {
      button.addEventListener('click', () => {
        const next = activeOptionKind === button.dataset.optionKind ? '' : button.dataset.optionKind;
        setOptionKind(next);
      });
      button.addEventListener('keydown', (event) => {
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const index = els.optionTabs.indexOf(button);
        let nextIndex = index;
        if (event.key === 'ArrowUp') nextIndex = (index - 1 + els.optionTabs.length) % els.optionTabs.length;
        if (event.key === 'ArrowDown') nextIndex = (index + 1) % els.optionTabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = els.optionTabs.length - 1;
        setOptionKind(els.optionTabs[nextIndex].dataset.optionKind, { focus: true });
      });
    });
    [els.platformSettingsList, els.accessorySettingsList, els.regionSettingsList].forEach((list) => {
      list.addEventListener('click', handleOptionAction);
    });
    els.addPlatformBtn.addEventListener('click', addPlatform);
    els.addAccessoryBtn.addEventListener('click', addAccessoryType);
    els.addRegionBtn.addEventListener('click', addRegion);
    els.newRegionCurrency.addEventListener('input', () => {
      els.newRegionCurrency.value = els.newRegionCurrency.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    });
    [els.newPlatformLabel, els.newAccessoryLabel, els.newRegionLabel, els.newRegionCurrency].forEach((input) => {
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (input === els.newPlatformLabel) addPlatform();
        else if (input === els.newAccessoryLabel) addAccessoryType();
        else addRegion();
      });
    });
    els.resetSettingsBtn.addEventListener('click', resetDefaultSettings);
    els.checkUpdateBtn.addEventListener('click', checkForUpdate);
    if (systemThemeQuery.addEventListener) {
      systemThemeQuery.addEventListener('change', () => {
        if (settings.theme === 'system') applyTheme();
      });
    }

    els.installSideBtn.addEventListener('click', openInstallGuide);
    els.installFromDataBtn.addEventListener('click', () => {
      closeDataDialog();
      openInstallGuide();
    });
    els.installPromptBtn.addEventListener('click', async () => {
      await promptInstall();
      if (els.installDialog.open) els.installDialog.close();
    });
    els.closeInstall.addEventListener('click', () => els.installDialog.close());
    els.closeInstallFoot.addEventListener('click', () => els.installDialog.close());
    els.installDialog.addEventListener('click', (event) => {
      if (event.target === els.installDialog) els.installDialog.close();
    });

    els.adjustWalletBtn.addEventListener('click', () => openWalletDialog());
    els.walletList.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]');
      if (action && action.dataset.action === 'adjust') {
        openWalletDialog(action.dataset.region || '', action.dataset.currency || '');
        return;
      }
      const card = event.target.closest('.wallet-card');
      if (card) openWalletDetail(card.dataset.region || '', card.dataset.currency || '');
    });
    els.walletList.addEventListener('keydown', (event) => {
      const card = event.target.closest('.wallet-card');
      if (!card || event.target !== card) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openWalletDetail(card.dataset.region || '', card.dataset.currency || '');
    });
    els.closeWalletDetail.addEventListener('click', closeWalletDetail);
    els.walletDetailDialog.addEventListener('click', (event) => {
      if (event.target === els.walletDetailDialog) closeWalletDetail();
    });
    els.walletDetailTabs.forEach((button) => {
      button.addEventListener('click', () => setWalletDetailTab(button.dataset.walletTab));
    });
    els.walletDetailAdjust.addEventListener('click', () => {
      if (walletDetailState.region) openWalletDialog(walletDetailState.region, walletDetailState.currency);
    });
    els.walletDetailPointcard.addEventListener('click', () => {
      if (walletDetailState.region) openRecordDialog(null, 'pointcard', walletDetailState.region);
    });
    els.walletDetailEshop.addEventListener('click', () => {
      if (walletDetailState.region) openRecordDialog(null, 'eshop', walletDetailState.region);
    });
    els.walletDetailList.addEventListener('click', (event) => {
      const row = event.target.closest('[data-id]');
      if (!row) return;
      const record = records.find((item) => item.id === row.dataset.id);
      if (record) openRecordDialog(record);
    });
    els.walletForm.addEventListener('submit', handleWalletSubmit);
    els.walletRegion.addEventListener('change', () => {
      setCurrencyForRegion(els.walletRegion, els.walletCurrency);
      updateWalletAmountStep();
    });
    els.walletCurrency.addEventListener('change', updateWalletAmountStep);
    els.closeWallet.addEventListener('click', closeWalletDialog);
    els.cancelWallet.addEventListener('click', closeWalletDialog);
    els.walletDialog.addEventListener('click', (event) => {
      if (event.target === els.walletDialog) closeWalletDialog();
    });
    els.walletForm.addEventListener('input', () => {
      if (els.walletError.textContent) els.walletError.textContent = '';
    });

    els.confirmCancel.addEventListener('click', () => settleConfirm(false));
    els.confirmOk.addEventListener('click', () => settleConfirm(true));
    els.confirmDialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      settleConfirm(false);
    });
    els.confirmDialog.addEventListener('click', (event) => {
      if (event.target === els.confirmDialog) settleConfirm(false);
    });
    els.confirmDialog.addEventListener('close', () => {
      if (confirmResolver) {
        const resolve = confirmResolver;
        confirmResolver = null;
        resolve(false);
      }
    });

    els.toast.addEventListener('click', (event) => {
      if (event.target.closest('#toastAction') && toastActionHandler) {
        const handler = toastActionHandler;
        hideToast();
        handler();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector('dialog[open]')) return;
      const target = event.target;
      const typing = target && target.matches && target.matches('input, textarea, select, [contenteditable="true"]');
      if (typing) return;
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        openRecordDialog(null, newRecordCategory());
      } else if (event.key === '/') {
        event.preventDefault();
        if (currentViewFromHash() !== 'ledger') {
          window.location.hash = 'ledger';
          window.setTimeout(() => els.searchInput.focus(), 80);
        } else {
          els.searchInput.focus();
        }
      }
    });

    window.addEventListener('hashchange', handleHashChange);

    els.viewLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (currentViewFromHash() === link.dataset.viewLink) {
          applyView(link.dataset.viewLink, { scroll: true });
        }
      });
    });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      handleInstallState();
      showToast('已安装到桌面，之后可以离线打开');
    });

    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) return;
      const state = loadState();
      records = state.records;
      balanceAdjustments = state.adjustments;
      settings = state.settings;
      applyTheme();
      populateOptionSelects();
      render();
      showToast('账本已从另一个窗口同步');
    });

    const displayMode = window.matchMedia('(display-mode: standalone)');
    if (displayMode.addEventListener) {
      displayMode.addEventListener('change', handleInstallState);
    }
  }

  function setupServiceWorker() {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') return;

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });
        const promptUpdate = (worker) => {
          if (!worker) return;
          showToast('新版本已准备好', {
            actionLabel: '刷新',
            duration: 15000,
            onAction: () => {
              refreshingForUpdate = true;
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        };

        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptUpdate(newWorker);
            }
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshingForUpdate) window.location.reload();
        });
      } catch (error) {
        console.warn('Service Worker 注册失败', error);
      }
    });
  }

  function currentViewFromHash() {
    const raw = window.location.hash.replace(/^#/, '');
    return VIEWS.includes(raw) ? raw : 'overview';
  }

  function scrollPageTop() {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }

  function applyView(view, options = {}) {
    const normalized = VIEWS.includes(view) ? view : 'overview';
    if (els.overviewView) els.overviewView.hidden = normalized !== 'overview';
    if (els.ledgerView) els.ledgerView.hidden = normalized !== 'ledger';
    if (els.statsView) els.statsView.hidden = normalized !== 'stats';
    if (els.settingsView) els.settingsView.hidden = normalized !== 'settings';
    els.viewLinks.forEach((link) => {
      const active = link.dataset.viewLink === normalized;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    if (options.scroll) {
      window.requestAnimationFrame(() => {
        scrollPageTop();
        window.setTimeout(scrollPageTop, 0);
      });
    }
    return normalized;
  }

  function handleHashChange() {
    const view = currentViewFromHash();
    applyView(view, { scroll: true });
    const normalizedHash = `#${view}`;
    if (window.location.hash !== normalizedHash) {
      try {
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}${normalizedHash}`);
      } catch (_) {
        // 某些本地环境下 replaceState 不可用，不影响功能。
      }
    }
  }

  function handleUrlActions() {
    const params = new URLSearchParams(window.location.search);
    const soldFilter = params.get('filter') === 'sold';
    if (soldFilter) {
      ui.type = 'physical';
      ui.filter = 'sold';
    }
    const view = soldFilter ? 'ledger' : currentViewFromHash();
    applyView(view, { scroll: soldFilter });
    if (soldFilter) render();

    if (params.get('action') === 'new') {
      const category = params.get('category');
      const presetCategory = ['accessory', 'cartridge', 'pointcard', 'eshop'].includes(category) ? category : null;
      window.setTimeout(() => openRecordDialog(null, presetCategory), 320);
    }
    const normalizedHash = `#${view}`;
    if (params.has('action') || params.has('filter') || window.location.hash !== normalizedHash) {
      try {
        history.replaceState(null, '', `${window.location.pathname}${normalizedHash}`);
      } catch (_) {
        // 某些本地环境下 replaceState 不可用，不影响功能。
      }
    }
  }

  function init() {
    const state = loadState();
    records = state.records;
    balanceAdjustments = state.adjustments;
    settings = state.settings;
    applyTheme();
    populateOptionSelects();
    bindEvents();
    const savedStatsExpanded = getMeta().statsExpanded;
    const defaultStatsExpanded = typeof savedStatsExpanded === 'boolean'
      ? savedStatsExpanded
      : window.matchMedia('(max-width: 760px)').matches;
    setStatsExpanded(defaultStatsExpanded);
    render();
    handleInstallState();
    handleUrlActions();
    setupServiceWorker();
    if (navigator.storage && typeof navigator.storage.persist === 'function') {
      navigator.storage.persist().catch(() => {});
    }
  }

  init();
})();
