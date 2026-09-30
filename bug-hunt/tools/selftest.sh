#!/bin/sh
# Run the project's own ?selftest=1 suite (113 checks) under jsdom against the CURRENT js/ and tests/.
set -e
H=$(cd "$(dirname "$0")" && pwd); R="$H/../.."; S="$H/.selftest"
rm -rf "$S" && mkdir -p "$S/sim" "$S/tests"
cp "$H"/sim/env.mjs "$H"/sim/loader.mjs "$H"/sim/register.mjs "$H"/sim/post.mjs "$H"/sim/boot.mjs "$S/sim/"
sed 's#getSize(v){return v.set(this.w,this.h)}}#getSize(v){return v.set(this.w,this.h)}getDrawingBufferSize(v){return v.set(this.w*this._pr,this.h*this._pr)}}#' "$H/sim/three-wrap.mjs" | sed "s|'../node_modules/|'../../node_modules/|g" > "$S/sim/three-wrap.mjs"
for f in field castle-detail knight; do cp "$R/js/$f.js" "$S/sim/"; done
cp "$R/js/game.js" "$S/sim/game.js"; grep '^export const __t=' -A1 "$H/sim/game.js" >> "$S/sim/game.js"
for f in smoke regression field; do sed "s#'../js/field.js'#'../sim/field.js'#" "$R/tests/$f.js" > "$S/tests/$f.js"; done
sed -i "s#new URL('../node_modules/three#new URL('../../node_modules/three#" "$S/sim/loader.mjs"
sed -i "s#new URL('../../../index.html'#new URL('../../../../index.html'#" "$S/sim/env.mjs"
cat > "$S/sim/run.mjs" << 'EOT'
import './env.mjs';
Object.defineProperty(window.HTMLCanvasElement.prototype,'clientWidth',{get:()=>1280});Object.defineProperty(window.HTMLCanvasElement.prototype,'clientHeight',{get:()=>800});
await import('./boot.mjs');await new Promise(r=>setTimeout(r,5000));
console.log('RESULT passed=',document.body.dataset.testsPassed);process.exit(document.body.dataset.testsPassed?0:1);
EOT
cd "$S/sim" && QS='?selftest=1' node --import ./register.mjs run.mjs 2>&1 | grep -E "FAIL|Error|COMPLETE|RESULT|FIELD"
