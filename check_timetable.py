import json

with open('public/data/bus-stops.json', encoding='utf-8') as f:
    data = json.load(f)

# timetableの構造を詳しく確認
for s in data[:15]:
    tt = s.get('timetable', [])
    if tt:
        sid = s['id']
        nm = s['name']
        print(f'ID:{sid} name:{nm}')
        for t in tt:
            print(f'  keys: {list(t.keys())}')
            print(f'  {t}')
        print()

# GTFSから生成したバス停のtimetable有無確認
gtfs_stops = [s for s in data if s['id'].startswith('bus_gtfs_')]
tt_stops = [s for s in gtfs_stops if s.get('timetable')]
print(f'GTFS停: {len(gtfs_stops)}件, timetableあり: {len(tt_stops)}件')

# 手動データのtimetable確認
manual_stops = [s for s in data if not s['id'].startswith('bus_gtfs_')]
print(f'手動停: {len(manual_stops)}件, timetableあり: {len([s for s in manual_stops if s.get("timetable")])}件')

# 方向情報があるかチェック
has_dir = [s for s in data if any('direction' in t for t in s.get('timetable', []))]
print(f'方向情報あり: {len(has_dir)}件')
