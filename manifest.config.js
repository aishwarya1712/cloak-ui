import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Cloak UI',
  version: '1.0.0',
  action: {
    default_popup: 'index.html',
    default_icon: 'icon.png',
  },
  icons: {
    "16": "icon.png",
    "48": "icon.png",
    "128": "icon.png"
  },
})
