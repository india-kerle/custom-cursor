# ✨ Custom Cursor

A Chrome extension that replaces your cursor with a customisable one. Make clicking more interesting. 

## Features

- **Custom cursor shapes**: Arrow, Heart, Sparkle, Pointer
- **Trail effects**: Sparkles, Hearts, Rainbow
- **Fully customisable**:
  - Color picker
  - Cursor size (16-48px)
  - Trail intensity (1-10)
- **Works on all websites**

## Installation

### From source (Developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/india-kerle/custom-cursor.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked**

5. Select the cloned `custom-cursor` folder

6. Click the extension icon in your toolbar to customise. 

## Usage

1. Click the ✨ sparkle icon in your Chrome toolbar
2. Choose your cursor shape, trail type, colors, and sizes
3. The preview shows your settings in real-time

## Screenshots

The extension popup features a retro Windows 95 aesthetic:

- Pink gradient title bar
- Beveled buttons and controls
- Live preview of your cursor and trail

## Files

```
custom-cursor/
├── manifest.json      # Extension configuration
├── background.js      # Service worker for settings
├── content.js         # Injected script (cursor + trails)
├── popup.html         # Settings popup structure
├── popup.css          # Retro Windows 95 styling
├── popup.js           # Settings logic + preview
├── icons/             # Extension icons (✨ emoji)
└── README.md          # This file
```

## License

MIT
