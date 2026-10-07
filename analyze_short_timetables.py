import json

with open('public/data/bus-stops.json', encoding='utf-8') as f:
    stops = json.load(f)

count_single_hour = 0
for s in stops:
    for t in s.get('timetable', []):
        wd = t.get('weekday', [])
        we = t.get('weekend', [])
        hours = set(x.split(':')[0] for x in wd + we if ':' in x)
        if len(hours) <= 1:
            count_single_hour += 1
            if count_single_hour <= 30:
                print(f"{s['id']} {s['name']} | route: {t.get('route')} | dir: {t.get('direction')} | wd: {wd} | we: {we}")

print(f"Total entries with <= 1 hour: {count_single_hour}")
