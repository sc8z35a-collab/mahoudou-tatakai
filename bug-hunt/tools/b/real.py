# Low-memory real-browser smoke: WebGL via SwiftShader at tiny viewport; shrinks shadow maps/canvas textures via init script.
import sys, asyncio
from playwright.async_api import async_playwright
url=sys.argv[1]; out=sys.argv[2]; wait=float(sys.argv[3]) if len(sys.argv)>3 else 40
INIT="""(()=>{const oc=HTMLCanvasElement.prototype.getContext;const ow=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width');
Object.defineProperty(HTMLCanvasElement.prototype,'width',{set(v){ow.set.call(this,this.id==='world'?v:Math.min(v,128))},get(){return ow.get.call(this)}});
const oh=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'height');Object.defineProperty(HTMLCanvasElement.prototype,'height',{set(v){oh.set.call(this,this.id==='world'?v:Math.min(v,128))},get(){return oh.get.call(this)}});})();"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--js-flags=--max-old-space-size=384"])
        pg=await b.new_page(viewport={"width":320,"height":200},device_scale_factor=1)
        await pg.add_init_script(INIT)
        logs=[]
        pg.on("console",lambda m:logs.append(f"[{m.type}] {m.text}"[:300]))
        pg.on("pageerror",lambda e:logs.append(f"[pageerror] {e}"[:500]))
        await pg.goto(url,timeout=120000)
        for i in range(int(wait)):
            await pg.wait_for_timeout(1000)
            if await pg.evaluate("document.body.dataset.testsComplete==='true'||(!location.search.includes('selftest')&&document.body.dataset.sceneReady==='true')"): break
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=out)
        print("\n".join(logs[-40:]))
        await b.close()
asyncio.run(main())
