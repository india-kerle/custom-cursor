// Background service worker - handles settings management

const defaultSettings = {
  enabled: true,
  color: '#ff69b4',
  shape: 'arrow',
  trail: 'sparkles',
  intensity: 5
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: defaultSettings });
    }
    updateBadge(result.settings?.enabled ?? defaultSettings.enabled);
  });
});

// Update badge based on enabled state
function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? '' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#666' });
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.settings) {
    const newSettings = changes.settings.newValue;
    if (newSettings) {
      updateBadge(newSettings.enabled);
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    chrome.storage.local.get('settings', (result) => {
      sendResponse({ settings: result.settings ?? defaultSettings });
    });
    return true;
  }
});
