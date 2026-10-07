import json
with open('public/data/bus-stops.json', encoding='utf-8') as f:
    data = json.load(f)

# 多方向持ちのサンプル確認
multi = [s for s in data if len(s.get('timetable', [])) > 3]
print(f'4方向以上: {len(multi)}件')

# 方向なしのバス停
no_dir = [s for s in data if s.get('timetable') and not any(t.get('direction') for t in s['timetable'])]
print(f'direction未設定(旧形式): {len(no_dir)}件')

# サンプル表示
if multi:
    s = multi[0]
    nm = s['name']
    print(f'サンプル: {nm}')
    for t in s['timetable'][:4]:
        wd = t['weekday'][:3]
        we = t['weekend'][:3]
        d = t.get('direction','なし')
        r = t['route']
        print(f'  route={r}, dir={d}, wd={wd}, we={we}')

# GTFSマッチしたバス停数
matched = [s for s in data if any(t.get('direction') for t in s.get('timetable', []))]
print(f'GTFSマッチ済み: {len(matched)}件')
print(f'未マッチ(旧形式のまま): {len(no_dir)}件')
