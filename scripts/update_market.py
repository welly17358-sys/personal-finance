"""Fetch latest TWSE daily closing prices; fail closed if data is malformed.
The endpoint does not reliably provide the per-security trade date. Display fetch timestamp
and verify actual trading date before treating this as today's close.
"""
import json,datetime,urllib.request,pathlib
from zoneinfo import ZoneInfo
CODES={'0050','0052','0056','00830','00881','00919','00923','00929'}
URL='https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL'
req=urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0 (finance dashboard personal research)','Accept':'application/json'})
with urllib.request.urlopen(req,timeout=30) as r:
    data=json.load(r)
quotes={}
for row in data:
    code=str(row.get('Code','')).strip()
    if code not in CODES:continue
    try:close=float(str(row['ClosingPrice']).replace(',',''))
    except (ValueError,TypeError,KeyError):continue
    if not (0<close<100000):continue
    quotes[code]={'close':close,'name':row.get('Name','')}
if len(quotes)<len(CODES):raise RuntimeError(f'Only {len(quotes)} of {len(CODES)} ETF quotes available; preserving prior data')
now=datetime.datetime.now(ZoneInfo('Asia/Taipei')).isoformat()
path=pathlib.Path(__file__).resolve().parents[1]/'data/market.json'
path.write_text(json.dumps({'fetched_at':now,'source':URL,'quotes':quotes},ensure_ascii=False,indent=2)+'\n')
print('Saved',len(quotes),'quotes at',now)
