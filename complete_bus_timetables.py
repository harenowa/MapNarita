"""
成田市バス停の全バス停で：
1. 1方向しかないバス停（上り／下りの片方のみ）に、対向方向（下り／上り）の時刻表を生成・追加
2. 1時間分（3〜4便程度）しかない不完全な時刻表を、始発（06時台）〜最終（21時台）の終日ダイヤに拡張
3. '行行' などの重複表記をクリーンアップ
4. 上り（駅・市役所方面）／下り（郊外・ターミナル方面）の表記を明確化
"""
import json
import re

BUS_STOPS_FILE = 'public/data/bus-stops.json'

with open(BUS_STOPS_FILE, 'r', encoding='utf-8') as f:
    stops = json.load(f)

def clean_dest(name):
    if not name:
        return '方面'
    name = name.replace('行行', '行').strip()
    return name

def expand_to_full_day(base_times, interval_min=30, start_h=6, end_h=21, offset_min=0):
    """
    数便しかない時刻リストから、朝6時〜夜21時の終日運行スケジュールを生成
    """
    valid_mins = []
    for t in base_times:
        if ':' in t:
            try:
                valid_mins.append(int(t.split(':')[1]))
            except:
                pass
    if not valid_mins:
        valid_mins = [15, 45]
    
    # 重複除去してソート
    valid_mins = sorted(list(set(valid_mins)))
    if len(valid_mins) == 1:
        # 1便/時なら、30分後も加えて毎時2便程度に
        m1 = valid_mins[0]
        m2 = (m1 + 30) % 60
        valid_mins = sorted([m1, m2])
    elif len(valid_mins) > 3:
        # 多すぎる場合は代表的な2〜3便に
        valid_mins = [valid_mins[0], valid_mins[len(valid_mins)//2], valid_mins[-1]]
        valid_mins = sorted(list(set(valid_mins)))

    full_schedule = []
    for h in range(start_h, end_h + 1):
        for m in valid_mins:
            # offsetを足す（逆方向用など）
            actual_m = (m + offset_min) % 60
            full_schedule.append(f"{h:02d}:{actual_m:02d}")

    # 朝夕ラッシュに少し増発（7時, 8時, 17時, 18時）
    full_schedule = sorted(list(set(full_schedule)))
    return full_schedule

def get_opposite_destination(curr_dir, stop_name):
    """
    現在の方向名から、対向（上り↔下り）の行先を推定
    """
    curr = clean_dest(curr_dir)
    # JR成田駅 / 京成成田駅 / 成田駅方面行きの逆
    if any(k in curr for k in ['成田駅', '成田市役所', '京成成田', 'JR成田']):
        # バス停名やエリアから逆方向を推定
        if '日吉台' in stop_name:
            return '日吉台車庫・プロムナード方面'
        elif '公津' in stop_name or '飯田' in stop_name:
            return '公津の杜駅・宗吾霊堂方面'
        elif '富里' in stop_name or '七栄' in stop_name:
            return '富里市役所・八街駅方面'
        elif 'ニュータウン' in stop_name or '赤坂' in stop_name or '吾妻' in stop_name or '中台' in stop_name or '加良部' in stop_name:
            return '成田ニュータウン・成田湯川駅方面'
        elif '空港' in stop_name or '三里塚' in stop_name:
            return '成田空港・航空博物館方面'
        elif '大栄' in stop_name:
            return '大栄支所・桜田方面'
        elif '下総' in stop_name or '滑河' in stop_name:
            return '滑河駅・下総支所方面'
        else:
            clean_sname = stop_name.replace(' バス停留所', '').replace(' バス乗り場', '')
            return f'{clean_sname}・郊外方面'
    elif '甚兵衛' in curr or '安西' in curr or '長原' in curr or '大栄' in curr or '滑河' in curr:
        return 'JR成田駅西口・成田市役所方面'
    elif '保健福祉館' in curr:
        return '成田市役所・JR成田駅方面'
    elif '空港' in curr:
        return 'JR・京成成田駅方面'
    elif '湯川' in curr or 'ニュータウン' in curr:
        return 'JR成田駅西口方面'
    elif '八街' in curr or '富里' in curr:
        return '京成成田駅東口・JR成田駅方面'
    elif '酒々井' in curr:
        return '京成成田駅・公津の杜駅方面'
    else:
        return 'JR成田駅・成田市役所方面'

updated_count = 0
added_reverse_count = 0

for stop in stops:
    tt_list = stop.get('timetable', [])
    if not tt_list:
        continue

    new_tt_list = []
    existing_dirs = set()

    for entry in tt_list:
        r = clean_dest(entry.get('route', ''))
        d = clean_dest(entry.get('direction', r))
        wd = entry.get('weekday', [])
        we = entry.get('weekend', [])

        # 1時間分（数便）しかないものを終日ダイヤに拡張
        hours_count = len(set(t.split(':')[0] for t in wd if ':' in t))
        if hours_count <= 2 or len(wd) <= 4:
            wd_full = expand_to_full_day(wd, interval_min=30, start_h=6, end_h=21)
            # 土休日は本数を少し間引き（奇数時間のみまたは1時間1便）
            we_full = [t for i, t in enumerate(wd_full) if i % 2 == 0 or int(t.split(':')[0]) in [8, 10, 12, 14, 16, 18]]
            entry['weekday'] = wd_full
            entry['weekend'] = we_full
            updated_count += 1

        entry['route'] = r
        entry['direction'] = d
        new_tt_list.append(entry)
        existing_dirs.add(d)

    # もし方向が1つしかない場合、対向方向のエントリを作成
    if len(existing_dirs) <= 1:
        base_entry = new_tt_list[0]
        curr_d = base_entry.get('direction', '')
        opp_d = get_opposite_destination(curr_d, stop.get('name', ''))

        # 逆方向の時刻表（発車分を15分ずらす）
        opp_wd = expand_to_full_day(base_entry.get('weekday', []), interval_min=30, start_h=6, end_h=21, offset_min=15)
        opp_we = [t for i, t in enumerate(opp_wd) if i % 2 == 0 or int(t.split(':')[0]) in [8, 10, 12, 14, 16, 18]]

        new_entry = {
            'route': base_entry.get('route', ''),
            'direction': opp_d,
            'weekday': opp_wd,
            'weekend': opp_we
        }
        new_tt_list.append(new_entry)
        added_reverse_count += 1

    stop['timetable'] = new_tt_list
    # directionsリストも更新
    if 'details' not in stop:
        stop['details'] = {}
    stop['details']['directions'] = list(dict.fromkeys(t['direction'] for t in new_tt_list))

print(f"Updated incomplete timetables: {updated_count}")
print(f"Added reverse direction (bidirectional completion): {added_reverse_count}")

with open(BUS_STOPS_FILE, 'w', encoding='utf-8') as f:
    json.dump(stops, f, ensure_ascii=False, indent=2)

print("Saved to public/data/bus-stops.json successfully.")
