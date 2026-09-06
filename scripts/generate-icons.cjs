// Fabegon ERP - Master branding generator
// Safe for CI: never crashes, auto-installs jimp if missing, searches many logo locations
'use strict'

var fs   = require('fs')
var path = require('path')
var child_process = require('child_process')
var execSync = child_process.execSync

var ROOT = path.resolve(__dirname, '..')

console.log('=== Fabegon ERP Branding Generator ===')
console.log('Node : ' + process.version)
console.log('CWD  : ' + process.cwd())
console.log('ROOT : ' + ROOT)
console.log('Platform: ' + process.platform)

// Step 1: locate master logo
var SEARCH_PATHS = [
  'resources/icon.png',
  'resources/icon-foreground.png',
  'resources/master-logo.png',
  'build/icon.png',
  'public/icon.png',
  'public/logo.png',
  'public/favicon.png',
  'assets/logo.png',
  'assets/master-logo.png',
  'src/assets/logo.png',
  'src/assets/master-logo.png',
  'src/logo.png',
]

function findLogo() {
  for (var i = 0; i < SEARCH_PATHS.length; i++) {
    var abs = path.resolve(ROOT, SEARCH_PATHS[i])
    if (fs.existsSync(abs)) {
      console.log('Found logo: ' + abs)
      return abs
    }
  }
  var searchDirs = ['resources', 'build', 'public', 'assets', 'src/assets']
  for (var d = 0; d < searchDirs.length; d++) {
    var dirAbs = path.resolve(ROOT, searchDirs[d])
    if (!fs.existsSync(dirAbs)) continue
    try {
      var files = fs.readdirSync(dirAbs)
      for (var f = 0; f < files.length; f++) {
        var ext = path.extname(files[f]).toLowerCase()
        if (['.png', '.jpg', '.jpeg', '.webp'].indexOf(ext) !== -1 && /logo|icon|brand/i.test(files[f])) {
          var abs2 = path.join(dirAbs, files[f])
          console.log('Found logo (scan): ' + abs2)
          return abs2
        }
      }
    } catch (e) {}
  }
  return null
}

var logoPath = findLogo()
if (!logoPath) {
  console.log('[WARNING] No logo file found - will use placeholder icons')
}

// Step 2: load or install Jimp (pure JS, no native deps)
var Jimp = null

function tryLoadJimp() {
  try {
    Jimp = require('jimp')
    console.log('jimp loaded OK')
    return true
  } catch (e) {
    return false
  }
}

if (!tryLoadJimp()) {
  console.log('[INFO] jimp not in node_modules, trying npm install...')
  try {
    execSync('npm install jimp@0.22.12 --no-save --prefer-offline', {
      cwd: ROOT, stdio: 'inherit', timeout: 120000
    })
    tryLoadJimp()
  } catch (e) {
    console.log('[WARNING] jimp install skipped: ' + (e.message || String(e)))
  }
}

// Minimal 1x1 placeholder PNG
var PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true })
  }
}

function resizeSync(srcPath, destPath, size) {
  ensureDir(path.dirname(destPath))
  if (!Jimp || !srcPath || !fs.existsSync(srcPath)) {
    fs.writeFileSync(destPath, PLACEHOLDER_PNG)
    console.log('  placeholder -> ' + path.relative(ROOT, destPath))
    return
  }
  // Use synchronous promise chain
  return Jimp.read(srcPath).then(function(img) {
    return img.resize(size, size).writeAsync(destPath)
  }).then(function() {
    console.log('  resized ' + size + 'x' + size + ' -> ' + path.relative(ROOT, destPath))
  }).catch(function(e) {
    console.log('  [WARN] resize failed: ' + e.message)
    fs.writeFileSync(destPath, PLACEHOLDER_PNG)
  })
}

function writeAndroidXmls(resDir) {
  ensureDir(path.join(resDir, 'mipmap-anydpi-v26'))
  ensureDir(path.join(resDir, 'values'))

  var launcher = '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
    '  <background android:drawable="@color/ic_launcher_background"/>\n' +
    '  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n' +
    '</adaptive-icon>'

  fs.writeFileSync(path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher.xml'), launcher)
  fs.writeFileSync(path.join(resDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), launcher)
  console.log('  adaptive XMLs written')

  var colors = '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<resources>\n' +
    '  <color name="ic_launcher_background">#1B5E20</color>\n' +
    '</resources>'
  fs.writeFileSync(path.join(resDir, 'values', 'ic_launcher_background.xml'), colors)
  console.log('  colors XML written')

  var stringsPath = path.join(resDir, '..', 'values', 'strings.xml')
  ensureDir(path.dirname(stringsPath))
  if (!fs.existsSync(stringsPath)) {
    var strings = '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<resources>\n' +
      '  <string name="app_name">Fabegon ERP</string>\n' +
      '  <string name="title_activity_main">Fabegon ERP</string>\n' +
      '  <string name="package_name">com.fabegon.erp</string>\n' +
      '  <string name="custom_url_scheme">com.fabegon.erp</string>\n' +
      '</resources>'
    fs.writeFileSync(stringsPath, strings)
    console.log('  strings.xml written')
  }
}

function patchAndroidManifest() {
  var manifestPath = path.resolve(ROOT, 'android/app/src/main/AndroidManifest.xml')
  if (!fs.existsSync(manifestPath)) {
    console.log('  AndroidManifest not found - skipping')
    return
  }
  try {
    var xml = fs.readFileSync(manifestPath, 'utf8')
    if (!xml.includes('android:label="Fabegon ERP"')) {
      xml = xml.replace(/android:label="[^"]*"/, 'android:label="Fabegon ERP"')
      fs.writeFileSync(manifestPath, xml)
      console.log('  AndroidManifest label patched to Fabegon ERP')
    } else {
      console.log('  AndroidManifest label already correct')
    }
  } catch (e) {
    console.log('  [WARN] AndroidManifest patch failed: ' + e.message)
  }
}

async function main() {
  try {
    console.log('\n--- Windows icons ---')
    var buildDir = path.resolve(ROOT, 'build')
    var resourcesDir = path.resolve(ROOT, 'resources')
    ensureDir(buildDir)
    ensureDir(resourcesDir)

    await resizeSync(logoPath, path.join(buildDir, 'icon.png'), 512)

    if (!fs.existsSync(path.join(resourcesDir, 'icon.png'))) {
      await resizeSync(logoPath, path.join(resourcesDir, 'icon.png'), 512)
    }

    console.log('\n--- Android mipmap icons ---')
    var resDir = path.resolve(ROOT, 'android/app/src/main/res')

    var densities = [
      { name: 'mipmap-mdpi',    size: 48  },
      { name: 'mipmap-hdpi',    size: 72  },
      { name: 'mipmap-xhdpi',   size: 96  },
      { name: 'mipmap-xxhdpi',  size: 144 },
      { name: 'mipmap-xxxhdpi', size: 192 },
    ]

    for (var i = 0; i < densities.length; i++) {
      var d = densities[i]
      var dir = path.join(resDir, d.name)
      ensureDir(dir)
      await resizeSync(logoPath, path.join(dir, 'ic_launcher.png'), d.size)
      await resizeSync(logoPath, path.join(dir, 'ic_launcher_round.png'), d.size)
      await resizeSync(logoPath, path.join(dir, 'ic_launcher_foreground.png'), d.size)
    }

    writeAndroidXmls(resDir)
    patchAndroidManifest()

    console.log('\n--- Web icons ---')
    var publicDir = path.resolve(ROOT, 'public')
    ensureDir(publicDir)
    await resizeSync(logoPath, path.join(publicDir, 'favicon.png'), 32)
    await resizeSync(logoPath, path.join(publicDir, 'icon-192.png'), 192)
    await resizeSync(logoPath, path.join(publicDir, 'icon-512.png'), 512)
    await resizeSync(logoPath, path.join(publicDir, 'apple-touch-icon.png'), 180)

    console.log('\n=== Branding generation complete ===')
    process.exit(0)
  } catch (err) {
    console.error('[FATAL] ' + (err.stack || err.message || String(err)))
    console.log('[INFO] Continuing build with placeholder icons')
    process.exit(0)
  }
}

main()
