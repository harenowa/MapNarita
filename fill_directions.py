"""
GTFSでマッチしなかった残り129件のバス停に
route名からdirectionを補完するスクリプト。
"""
import json
import re

BUS_STOPS_JSON = r'public\data\bus-stops.json'

with open(BUS_STOPS_JSON, encoding='utf-8') as f:
    bus_stops = json.load(f)

# route名から行先を抽出するパターン
def extract_direction(route_name):
    """
    'JR成田駅西口行' -> 'JR成田駅西口'
    '公津の杜循環' -> '循環（公津の杜）'
    '多古本線' -> '多古方面'
    """
    if not route_name:
        return None
    
    # 「〇〇行」パターン
    m = re.search(r'(.+?)行$', route_name)
    if m:
        return m.group(1) + '行'
    
    # 「〇〇循環」パターン
    m = re.search(r'(.+?)循環', route_name)
    if m:
        return m.group(1) + '循環'
    
    # 「〇〇線」や「〇〇ルート」パターン → そのまま使う
    return route_name

updated = 0
for bus_stop in bus_stops:
    tt = bus_stop.get('timetable', [])
    if not tt:
        continue
    # directionが未設定のもの
    if any(t.get('direction') for t in tt):
        continue

    changed = False
    for t in tt:
        if not t.get('direction'):
            dir_guess = extract_direction(t.get('route', ''))
            if dir_guess:
                t['direction'] = dir_guess
                changed = True

    if changed:
        directions = list(dict.fromkeys(t.get('direction', '') for t in tt if t.get('direction')))
        if 'details' not in bus_stop:
            bus_stop['details'] = {}
        bus_stop['details']['directions'] = directions
        updated += 1

print(f"direction補完: {updated}件")

with open(BUS_STOPS_JSON, 'w', encoding='utf-8') as f:
    json.dump(bus_stops, f, ensure_ascii=False, indent=2)
print("保存完了")

# 最終確認
with open(BUS_STOPS_JSON, encoding='utf-8') as f:
    final = json.load(f)
has_dir = sum(1 for s in final if any(t.get('direction') for t in s.get('timetable', [])))
no_dir = sum(1 for s in final if s.get('timetable') and not any(t.get('direction') for t in s['timetable']))
print(f"最終: direction設定済={has_dir}件, 未設定残={no_dir}件")
