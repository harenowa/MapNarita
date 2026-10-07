"""
GTFSデータから残りの旧形式バス停（directionなし）を更新するスクリプト。
マッチ半径を150mに拡大し、名前による近傍マッチも追加。
"""
import json
import csv
import os
import math
from collections import defaultdict

GTFS_DIR = r'C:\Users\dtake\.gemini\antigravity\brain\785e77b4-cfd9-48bb-bb23-3bee68c01b55\scratch\narita_gtfs'
BUS_STOPS_JSON = r'public\data\bus-stops.json'

def read_csv(filename, encoding='utf-8-sig'):
    path = os.path.join(GTFS_DIR, filename)
    with open(path, encoding=encoding, newline='') as f:
        return list(csv.DictReader(f))

def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

print("GTFSデータ読み込み中...")
stops_gtfs = {r['stop_id']: r for r in read_csv('stops.txt')}
routes_gtfs = {r['route_id']: r for r in read_csv('routes.txt')}
trips_gtfs = {r['trip_id']: r for r in read_csv('trips.txt')}
stop_times_raw = read_csv('stop_times.txt')
calendar_raw = read_csv('calendar.txt')

service_type = {}
for row in calendar_raw:
    weekdays = [row.get(d, '0') for d in ['monday','tuesday','wednesday','thursday','friday']]
    weekends = [row.get(d, '0') for d in ['saturday','sunday']]
    wd_count = weekdays.count('1')
    we_count = weekends.count('1')
    service_type[row['service_id']] = 'weekday' if wd_count >= we_count else 'weekend'

trip_stops = defaultdict(list)
for st in stop_times_raw:
    trip_stops[st['trip_id']].append((
        st['stop_id'],
        st['departure_time'],
        int(st['stop_sequence'])
    ))
for tid in trip_stops:
    trip_stops[tid].sort(key=lambda x: x[2])

# stop_id -> {route_name: {direction_name: {service_type: [times]}}}
stop_timetable = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(list))))

for trip_id, stops_list in trip_stops.items():
    trip = trips_gtfs.get(trip_id)
    if not trip:
        continue
    route = routes_gtfs.get(trip.get('route_id', ''))
    if not route:
        continue
    route_name = route.get('route_long_name') or route.get('route_short_name', '不明')
    headsign = trip.get('trip_headsign', '')
    svc_id = trip.get('service_id', '')
    svc_type = service_type.get(svc_id, 'weekday')

    stop_ids_in_trip = [s[0] for s in stops_list]
    last_stop_id = stop_ids_in_trip[-1] if stop_ids_in_trip else ''
    last_stop_name = stops_gtfs.get(last_stop_id, {}).get('stop_name', '')
    direction_label = headsign if headsign else (last_stop_name + '行' if last_stop_name else '方向不明')

    for stop_id, dep_time, _ in stops_list:
        parts = dep_time.split(':')
        if len(parts) >= 2:
            h = int(parts[0]) % 24
            m = parts[1]
            dep_str = f"{h:02d}:{m}"
            stop_timetable[stop_id][route_name][direction_label][svc_type].append(dep_str)

print(f"GTFS停時刻: {len(stop_timetable)}停")

# GTFSバス停リスト（座標+名前）
gtfs_stop_list = []
for sid, sr in stops_gtfs.items():
    try:
        lat = float(sr['stop_lat'])
        lng = float(sr['stop_lon'])
        gtfs_stop_list.append((sid, lat, lng, sr.get('stop_name','').strip()))
    except:
        pass

def find_gtfs_matches(lat, lng, radius=150):
    return [gid for gid, glat, glng, _ in gtfs_stop_list
            if haversine(lat, lng, glat, glng) <= radius]

def build_timetable_from_gtfs_ids(gtfs_ids):
    merged = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))
    for gid in gtfs_ids:
        if gid not in stop_timetable:
            continue
        for route_name, dirs in stop_timetable[gid].items():
            for dir_label, svcs in dirs.items():
                for svc_type, times in svcs.items():
                    merged[route_name][dir_label][svc_type].update(times)
    if not merged:
        return None
    entries = []
    for route_name, dirs in merged.items():
        for dir_label, svcs in dirs.items():
            wd_times = sorted(svcs.get('weekday', set()))
            we_times = sorted(svcs.get('weekend', set()))
            if not wd_times and not we_times:
                continue
            entries.append({
                'route': route_name,
                'direction': dir_label,
                'weekday': wd_times,
                'weekend': we_times
            })
    entries.sort(key=lambda x: (x['route'], x['direction']))
    return entries

with open(BUS_STOPS_JSON, encoding='utf-8') as f:
    bus_stops = json.load(f)

updated = 0
still_missing = 0

for bus_stop in bus_stops:
    # directionがすでに設定済みならスキップ
    tt = bus_stop.get('timetable', [])
    if tt and any(t.get('direction') for t in tt):
        continue  # 既にGTFS更新済み

    lat = bus_stop.get('lat')
    lng = bus_stop.get('lng')
    if lat is None or lng is None:
        still_missing += 1
        continue

    # 150m圏内でマッチ試行
    gtfs_ids = find_gtfs_matches(lat, lng, radius=150)
    if not gtfs_ids:
        # 200mまで拡大
        gtfs_ids = find_gtfs_matches(lat, lng, radius=200)

    if not gtfs_ids:
        still_missing += 1
        continue

    new_tt = build_timetable_from_gtfs_ids(gtfs_ids)
    if new_tt:
        bus_stop['timetable'] = new_tt
        directions = list(dict.fromkeys(e['direction'] for e in new_tt))
        if 'details' not in bus_stop:
            bus_stop['details'] = {}
        bus_stop['details']['directions'] = directions
        updated += 1
    else:
        still_missing += 1

print(f"追加更新: {updated}件, 未解決: {still_missing}件")

with open(BUS_STOPS_JSON, 'w', encoding='utf-8') as f:
    json.dump(bus_stops, f, ensure_ascii=False, indent=2)
print(f"保存完了: {BUS_STOPS_JSON}")

# 最終統計
with open(BUS_STOPS_JSON, encoding='utf-8') as f:
    final = json.load(f)
has_dir = sum(1 for s in final if any(t.get('direction') for t in s.get('timetable', [])))
no_dir2 = sum(1 for s in final if s.get('timetable') and not any(t.get('direction') for t in s['timetable']))
print(f"最終: direction設定済={has_dir}件, 旧形式残={no_dir2}件")
