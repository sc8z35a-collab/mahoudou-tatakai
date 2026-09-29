# Usage: python3 shot.py URL out.png [w h] [wait_s] [js_after]
import sys, asyncio
from playwright.async_api import async_playwright
async def main():
    url, out = sys.argv[1], sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv)>3 else 1280
    h = int(sys.argv[4]) if len(sys.argv)>4 else 800
    wait = float(sys.argv[5]) if len(sys.argv)>5 else 8
    js = sys.argv[6] if len(sys.argv)>6 else None
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h}, device_scale_factor=1)
        pg.set_default_timeout(150000)
        logs=[]
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        await pg.goto(url)
        await pg.wait_for_timeout(wait*1000)
        if js:
            r = await pg.evaluate(js); print('JS result:', r)
            await pg.wait_for_timeout(2500)
        await pg.screenshot(path=out, timeout=150000)
        for l in logs[:80]: print(l[:600])
        await b.close()
asyncio.run(main())
