"""
GTFSデータからバス停ごとの上り・下り時刻表を抽出して
bus-stops.json の timetable を更新するスクリプト
"""
import json
import csv
import os
from collections import defaultdict

GTFS_DIR = r'C:\Users\dtake\.gemini\antigravity\brain\785e77b4-cfd9-48bb-bb23-3bee68c01b55\scratch\narita_gtfs'
BUS_STOPS_JSON = r'public\data\bus-stops.json'

def read_csv(filename, encoding='utf-8-sig'):
    path = os.path.join(GTFS_DIR, filename)
    with open(path, encoding=encoding, newline='') as f:
        return list(csv.DictReader(f))

print("GTFSデータ読み込み中...")

# --- GTFSファイル読み込み ---
stops_gtfs = {r['stop_id']: r for r in read_csv('stops.txt')}
routes_gtfs = {r['route_id']: r for r in read_csv('routes.txt')}
trips_gtfs = {r['trip_id']: r for r in read_csv('trips.txt')}
stop_times_raw = read_csv('stop_times.txt')
calendar_raw = read_csv('calendar.txt')

print(f"  stops: {len(stops_gtfs)}, routes: {len(routes_gtfs)}, trips: {len(trips_gtfs)}, stop_times: {len(stop_times_raw)}")

# --- カレンダー分類 (service_id -> 平日/休日) ---
service_type = {}  # service_id -> 'weekday' | 'weekend'
for row in calendar_raw:
    weekdays = [row.get(d, '0') for d in ['monday','tuesday','wednesday','thursday','friday']]
    weekends = [row.get(d, '0') for d in ['saturday','sunday']]
    wd_count = weekdays.count('1')
    we_count = weekends.count('1')
    if wd_count >= we_count:
        service_type[row['service_id']] = 'weekday'
    else:
        service_type[row['service_id']] = 'weekend'

print(f"  service types: weekday={sum(1 for v in service_type.values() if v=='weekday')}, weekend={sum(1 for v in service_type.values() if v=='weekend')}")

# --- stop_times → trip単位でまとめる ---
# trip_id -> list of (stop_id, departure_time, stop_sequence)
trip_stops = defaultdict(list)
for st in stop_times_raw:
    trip_stops[st['trip_id']].append((
        st['stop_id'],
        st['departure_time'],
        int(st['stop_sequence'])
    ))

# ソート
for tid in trip_stops:
    trip_stops[tid].sort(key=lambda x: x[2])

# --- バス停ごとに route, direction, 時刻を収集 ---
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
    # direction_id: 0=上り(inbound), 1=下り(outbound) (GTFSでは逆の場合もある)
    direction_id = trip.get('direction_id', '0')
    # headsign = 行先
    headsign = trip.get('trip_headsign', '')
    svc_id = trip.get('service_id', '')
    svc_type = service_type.get(svc_id, 'weekday')

    # 方向ラベル
    direction_label = headsign if headsign else (f"方向{direction_id}")

    stop_ids_in_trip = [s[0] for s in stops_list]
    last_stop_id = stop_ids_in_trip[-1] if stop_ids_in_trip else ''
    last_stop_name = stops_gtfs.get(last_stop_id, {}).get('stop_name', '')
    if last_stop_name and not headsign:
        direction_label = last_stop_name + '行'

    for stop_id, dep_time, _ in stops_list:
        # 時刻を HH:MM に正規化（GTFSは 25:00 などある）
        parts = dep_time.split(':')
        if len(parts) >= 2:
            h = int(parts[0]) % 24
            m = parts[1]
            dep_str = f"{h:02d}:{m}"
            stop_timetable[stop_id][route_name][direction_label][svc_type].append(dep_str)

print(f"  バス停別時刻収集完了: {len(stop_timetable)}停")

# --- 既存 bus-stops.json 読み込み ---
with open(BUS_STOPS_JSON, encoding='utf-8') as f:
    bus_stops = json.load(f)

# GTFSのstop_id → バス停名 のマッピングを作る
gtfs_name_to_id = {}
for sid, sr in stops_gtfs.items():
    nm = sr.get('stop_name', '').strip()
    gtfs_name_to_id.setdefault(nm, []).append(sid)

# バス停名で名寄せ（緯度経度による近傍マッチ）
import math
def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# GTFSのstop_idリスト（座標付き）
gtfs_stop_list = []
for sid, sr in stops_gtfs.items():
    try:
        lat = float(sr['stop_lat'])
        lng = float(sr['stop_lon'])
        gtfs_stop_list.append((sid, lat, lng, sr.get('stop_name','')))
    except:
        pass

MATCH_RADIUS = 80  # メートル

matched = 0
unmatched = 0

for bus_stop in bus_stops:
    lat = bus_stop.get('lat')
    lng = bus_stop.get('lng')
    if lat is None or lng is None:
        continue

    # 近傍GTFSバス停を探す
    nearby_gtfs_ids = []
    for gid, glat, glng, gname in gtfs_stop_list:
        dist = haversine(lat, lng, glat, glng)
        if dist <= MATCH_RADIUS:
            nearby_gtfs_ids.append(gid)

    if not nearby_gtfs_ids:
        unmatched += 1
        continue

    # 近傍のGTFS停の時刻表をマージ
    merged = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))
    for gid in nearby_gtfs_ids:
        if gid not in stop_timetable:
            continue
        for route_name, dirs in stop_timetable[gid].items():
            for dir_label, svcs in dirs.items():
                for svc_type, times in svcs.items():
                    merged[route_name][dir_label][svc_type].update(times)

    if not merged:
        unmatched += 1
        continue

    matched += 1

    # timetable構造に変換
    # [{ route, direction, weekday: [...], weekend: [...] }, ...]
    timetable_entries = []
    for route_name, dirs in merged.items():
        for dir_label, svcs in dirs.items():
            wd_times = sorted(svcs.get('weekday', set()))
            we_times = sorted(svcs.get('weekend', set()))
            if not wd_times and not we_times:
                continue
            timetable_entries.append({
                'route': route_name,
                'direction': dir_label,
                'weekday': wd_times,
                'weekend': we_times
            })

    # 方向でソート（行先名順）
    timetable_entries.sort(key=lambda x: (x['route'], x['direction']))
    bus_stop['timetable'] = timetable_entries

    # 方向リストをdetailsに追加
    directions = list(dict.fromkeys(e['direction'] for e in timetable_entries))
    if 'details' not in bus_stop:
        bus_stop['details'] = {}
    bus_stop['details']['directions'] = directions

print(f"マッチ成功: {matched}件, 失敗: {unmatched}件")

# --- 保存 ---
with open(BUS_STOPS_JSON, 'w', encoding='utf-8') as f:
    json.dump(bus_stops, f, ensure_ascii=False, indent=2)

print(f"保存完了: {BUS_STOPS_JSON}")

# サンプル確認
sample = next((s for s in bus_stops if s.get('timetable') and len(s['timetable']) > 1), None)
if sample:
    print(f"\nサンプル: {sample['name']}")
    for e in sample['timetable'][:4]:
        print(f"  route={e['route']}, dir={e['direction']}, wd={e['weekday'][:3]}, we={e['weekend'][:3]}")
