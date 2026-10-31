"""Change one setting of the installed app. usage: BAR=.. [BUSY_TOKEN=..] python tools/setting.py group.key value  (JSON value, e.g. 100, true, '"stormy"')"""
import json, os, sys, urllib.request
APP = "io.github.atostivint.hwclock"
bar, tok = os.environ.get("BAR", "10.0.4.20"), os.environ.get("BUSY_TOKEN", "")
hdr = {"X-API-Token": tok} if tok else {}
url = f"http://{bar}/api/apps/settings?app_id={APP}"
doc = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=hdr), timeout=8))
path, value = sys.argv[1].split("."), json.loads(sys.argv[2])
node = doc["values"]
for k in path[:-1]: node = node[k]
node[path[-1]] = value
req = urllib.request.Request(url, data=json.dumps(doc).encode(), method="PUT", headers={**hdr, "Content-Type": "application/json"})
print(urllib.request.urlopen(req, timeout=8).read().decode().strip())
