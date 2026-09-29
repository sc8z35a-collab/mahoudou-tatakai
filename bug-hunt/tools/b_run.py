# Agent B harness. usage: python3 b_run.py URL script.py out.png|- [w h dpr touch]
# script.py = body of `async def _f(pg)` (python, may use await pg.evaluate(...)); return value printed as JSON.
import sys, asyncio, json
from playwright.async_api import async_playwright
url,script,out=sys.argv[1],sys.argv[2],sys.argv[3]
w=int(sys.argv[4]) if len(sys.argv)>4 else 480; h=int(sys.argv[5]) if len(sys.argv)>5 else 300
dpr=float(sys.argv[6]) if len(sys.argv)>6 else 1; touch=len(sys.argv)>7 and sys.argv[7]=='touch'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        ctx=await b.new_context(viewport={"width":w,"height":h},device_scale_factor=dpr,has_touch=touch,is_mobile=touch)
        pg=await ctx.new_page(); pg.set_default_timeout(200000)
        logs=[]
        pg.on("console",lambda m:logs.append(f"[{m.type}] {m.text}"[:500]))
        pg.on("pageerror",lambda e:logs.append(f"[pageerror] {e}"[:800]))
        await pg.goto(url)
        try: await pg.wait_for_function("document.body.dataset.sceneReady==='true'",timeout=200000)
        except Exception as e: logs.append('NOT READY '+str(e)[:100])
        ns={}; src=open(script).read()
        exec("async def _f(pg):\n"+"\n".join("    "+l for l in src.splitlines()),ns)
        res=await ns['_f'](pg)
        if out!='-': await pg.screenshot(path=out)
        print("\n".join(logs[-80:])); print("RESULT:",json.dumps(res,ensure_ascii=False,default=str)[:8000])
        await b.close()
asyncio.run(main())
