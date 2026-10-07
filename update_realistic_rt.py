"""
バス停データに方向別のリアルタイム運行情報（rt_status_by_direction）を追加・更新するスクリプト。
また、時間帯ごとの分がすべて同じになっているバス停に対して、
朝夕ラッシュ（運行本数増）や日中の自然なダイヤゆらぎ（標準的な実ダイヤに近いパターン）を付与する。
"""
import json

BUS_STOPS_FILE = 'public/data/bus-stops.json'

with open(BUS_STOPS_FILE, 'r', encoding='utf-8') as f:
    stops = json.load(f)

# 各時間帯（6〜21時）における自然なダイヤを生成する関数
# 例: 基準分が [10, 40] の場合でも、朝ラッシュ（7, 8時）は増発（本数多め）、昼間は定間隔、夜は少し間引き
def generate_realistic_full_day(base_mins, offset_min=0):
    if not base_mins:
        base_mins = [15, 45]
    
    # 基準となる間隔 (例: 15分, 20分, 30分)
    m_base = sorted(list(set(base_mins)))
    
    realistic_schedule = []
    for h in range(6, 22):
        if h == 6:  # 早朝（始発）
            mins = [m_base[0] + 10]
        elif h in [7, 8]:  # 朝ラッシュ（増発）
            if len(m_base) == 1:
                mins = [m_base[0] - 5, m_base[0] + 15, m_base[0] + 35]
            else:
                mins = [m - 3 for m in m_base] + [m_base[0] + 18]
        elif h in [9, 10, 11, 12, 13, 14, 15]:  # 日中
            # 日中は基本パターンに若干の走行時間ゆらぎ(1〜2分)
            jitter = (h % 3) - 1
            mins = [m + jitter for m in m_base]
        elif h in [17, 18, 19]:  # 夕方ラッシュ（増発）
            if len(m_base) == 1:
                mins = [m_base[0], m_base[0] + 20, m_base[0] + 40]
            else:
                mins = [m + 2 for m in m_base] + [m_base[-1] + 15]
        elif h in [20, 21]:  # 夜間（帰宅・最終）
            mins = [m_base[0], m_base[-1] if len(m_base) > 1 else m_base[0] + 30]

        # 分を0〜59に正規化
        for m in mins:
            actual_m = (m + offset_min) % 60
            realistic_schedule.append(f"{h:02d}:{actual_m:02d}")

    # 重複排除してソート
    return sorted(list(set(realistic_schedule)))

for stop in stops:
    tt_list = stop.get('timetable', [])
    if not tt_list:
        continue

    # 時刻表の自然なバリエーション化
    for idx, entry in enumerate(tt_list):
        wd = entry.get('weekday', [])
        # 時間帯ごとの分が完全に均一かチェック
        by_h = {}
        for x in wd:
            if ':' in x:
                h, m = x.split(':')
                by_h.setdefault(h, []).append(m)
        min_sets = set(tuple(v) for v in by_h.values())
        
        # もし分が毎時完全に同一であれば、現実的なダイヤパターンを付与
        if len(min_sets) <= 1:
            base_m = [int(m) for m in list(by_h.values())[0]] if by_h else [15, 45]
            new_wd = generate_realistic_full_day(base_m, offset_min=idx*3)
            # 土休日は朝夕増発なしのシンプル日中ダイヤ
            new_we = [t for i, t in enumerate(new_wd) if i % 2 == 0 or int(t.split(':')[0]) in [8, 11, 14, 17]]
            entry['weekday'] = new_wd
            entry['weekend'] = new_we

    # 方向別リアルタイム運行情報 (rt_status_by_direction) の構築
    dirs = list(dict.fromkeys(t.get('direction') for t in tt_list if t.get('direction')))
    rt_by_dir = {}
    
    # 車両番号ベース
    base_plate = 200 + (len(stop['id']) * 7) % 700

    for i, d in enumerate(dirs):
        dir_entries = [t for t in tt_list if t.get('direction') == d]
        wd_times = dir_entries[0].get('weekday', []) if dir_entries else []
        
        # 次便のサンプル（日中14時台〜15時台の便、または先頭から数えた便）
        midday_times = [t for t in wd_times if t.startswith('14:') or t.startswith('15:')]
        if midday_times:
            next_time = midday_times[i % len(midday_times)]
        elif wd_times:
            next_time = wd_times[min(len(wd_times)-1, 10 + i * 2)]
        else:
            next_time = "14:25"

        delay = (i * 2 + (len(d) % 3)) % 5  # 0分〜4分遅延
        veh_num = f"千葉{base_plate} か {10 + (i*13)%80:02d}-{20 + (i*17 + len(stop['name']))%79:02d}"

        rt_by_dir[d] = {
            'active': True,
            'direction': d,
            'delayMinutes': delay,
            'nextBusTime': next_time,
            'vehicleNumber': veh_num,
            'isBarrierFreeVehicle': True,
            'crowdingLevel': ['座席に余裕あり', '座席あり', '立席あり'][i % 3]
        }

    stop['rt_status_by_direction'] = rt_by_dir
    # 代表のrt_statusも最初の方向に合わせておく
    if dirs and dirs[0] in rt_by_dir:
        stop['rt_status'] = rt_by_dir[dirs[0]]

with open(BUS_STOPS_FILE, 'w', encoding='utf-8') as f:
    json.dump(stops, f, ensure_ascii=False, indent=2)

print("Updated realistic timetables and rt_status_by_direction for all stops.")
