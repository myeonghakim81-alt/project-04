// 저장소 루트의 웹 소스(index.html, style.css, manifest.json, sw.js, js/, icons/)를
// Capacitor가 안드로이드 앱에 담을 www/ 로 그대로 복사한다.
// (Capacitor의 webDir이 저장소 루트를 직접 가리키면 node_modules/android/.git까지
//  함께 패키징되어 버리기 때문에, www/ 를 별도의 "빌드 산출물" 디렉터리로 둔다.)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const ENTRIES = ['index.html', 'style.css', 'manifest.json', 'sw.js', 'js', 'icons'];

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

for (const entry of ENTRIES) {
  fs.cpSync(path.join(ROOT, entry), path.join(WWW, entry), { recursive: true });
}

console.log('www/ synced from repo root:', ENTRIES.join(', '));
