# DOM-only screenshots (three.js blocked => no WebGL memory). usage: dom.py name w h "js" [touch]
import sys, asyncio
from playwright.async_api import async_playwright
name,w,h,js=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]; touch=len(sys.argv)>5
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={"width":w,"height":h},device_scale_factor=1,has_touch=touch,is_mobile=touch)
        pg=await ctx.new_page()
        await pg.route("**/cdn.jsdelivr.net/**",lambda r:r.abort())
        await pg.goto("http://localhost:8080/index.html"); await pg.wait_for_timeout(2500)
        await pg.evaluate("()=>{document.getElementById('loading')?.remove();document.getElementById('world').style.background='#3a4a44'}")
        r=await pg.evaluate(js); print(name,r)
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=f"/home/user/webapp/bug-hunt/shots/{name}.png")
        await b.close()
asyncio.run(main())
