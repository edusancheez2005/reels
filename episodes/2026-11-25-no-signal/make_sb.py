import json

SUIT = {"id": "suit", "model": "Bizdude.vrm", "at": [0.35, 0, 0.5], "yaw": 0, "tall": 1.75, "pose": "relax"}
STONKS = {"id": "stonks", "model": "StonksReporter.vrm", "at": [0.15, 0, -0.75], "yaw": 0, "tall": 1.6, "pose": "relax"}


def A(base, **kw):
    d = dict(base); d.update(kw); return d


def figure(x, z, hat="#0d0f12", eyes=True):
    p = [
        {"shape": "cyl", "at": [x, 0.62, z], "size": [0.23, 1.24], "color": "#121417"},
        {"shape": "ball", "at": [x, 1.38, z], "size": [0.15], "color": "#121417"},
        {"shape": "cyl", "at": [x, 1.5, z], "size": [0.3, 0.03], "color": hat},
        {"shape": "cyl", "at": [x, 1.6, z], "size": [0.17, 0.2], "color": hat},
        {"shape": "box", "at": [x, 1.08, z], "size": [0.62, 0.2, 0.3], "color": "#121417"},
    ]
    if eyes:
        p += [{"shape": "ball", "at": [x - 0.05, 1.4, z + 0.14], "size": [0.022], "color": "#ff2d3d", "glow": 1},
              {"shape": "ball", "at": [x + 0.05, 1.4, z + 0.14], "size": [0.022], "color": "#ff2d3d", "glow": 1}]
    return p


# the phone shop: counter, shelf of phones, a lit sign
SHOP = [
    {"shape": "box", "at": [0.15, 0.5, -0.2], "size": [2.0, 1.0, 0.55], "color": "#f4f6f8"},
    {"shape": "box", "at": [0.15, 1.02, -0.2], "size": [2.1, 0.05, 0.62], "color": "#3b3f46"},
    {"shape": "box", "at": [0.15, 0.5, 0.08], "size": [2.0, 0.12, 0.01], "color": "#3bc9ee"},
    {"shape": "box", "at": [0.2, 1.5, -2.45], "size": [3.0, 0.05, 0.3], "color": "#cfd5dc"},
    {"shape": "box", "at": [0.2, 1.0, -2.45], "size": [3.0, 0.05, 0.3], "color": "#cfd5dc"},
] + [{"shape": "box", "at": [x, 1.66, -2.4], "size": [0.14, 0.26, 0.02], "color": "#1c2430"} for x in (-1.0, -0.5, 0.0, 0.5, 1.0, 1.4)] \
  + [{"shape": "plane", "at": [x, 1.66, -2.385], "size": [0.12, 0.23], "color": "#7fdcff", "glow": 0.8} for x in (-1.0, -0.5, 0.0, 0.5, 1.0, 1.4)] \
  + [{"shape": "box", "at": [x, 1.16, -2.4], "size": [0.14, 0.26, 0.02], "color": "#1c2430"} for x in (-0.75, -0.25, 0.25, 0.75, 1.2)]
CARD = [{"shape": "box", "at": [-0.25, 1.052, 0.0], "size": [0.17, 0.006, 0.11], "color": "#ffffff", "glow": 0.35},
        {"shape": "box", "at": [-0.29, 1.057, 0.0], "size": [0.05, 0.004, 0.06], "color": "#c78b5a"}]

# your bedroom: bed with a sleeper-shaped lump, a nightstand with the phone, a window
BED = [
    {"shape": "box", "at": [-0.45, 0.2, -1.2], "size": [1.15, 0.4, 2.05], "color": "#6b4a35"},
    {"shape": "box", "at": [-0.45, 0.47, -1.2], "size": [1.08, 0.16, 1.98], "color": "#eef1f5"},
    {"shape": "box", "at": [-0.45, 0.6, -2.0], "size": [0.62, 0.12, 0.32], "color": "#ffffff"},
    {"shape": "box", "at": [-0.45, 0.78, -2.17], "size": [1.15, 0.75, 0.06], "color": "#5a3c2b"},
    {"shape": "box", "at": [-0.45, 0.57, -0.75], "size": [1.12, 0.06, 1.2], "color": "#3d6fd8"},
    {"shape": "box", "at": [0.5, 0.26, -1.95], "size": [0.45, 0.52, 0.42], "color": "#8a5a3c"},
    {"shape": "box", "at": [0.5, 0.6, -1.85], "size": [0.08, 0.15, 0.012], "color": "#11151b", "rot": [-12, 0, 0]},
    {"shape": "box", "at": [-1.7, 1.55, -2.55], "size": [1.0, 1.15, 0.04], "color": "#2b3a5e"},
    {"shape": "box", "at": [-1.7, 1.55, -2.52], "size": [0.04, 1.15, 0.03], "color": "#d9dde1"},
    {"shape": "box", "at": [-1.7, 1.55, -2.52], "size": [1.0, 0.04, 0.03], "color": "#d9dde1"},
    {"shape": "ball", "at": [-1.95, 1.85, -2.5], "size": [0.09], "color": "#fff4d6", "glow": 1},
]
LUMP = [{"shape": "cyl", "at": [-0.45, 0.72, -1.05], "size": [0.26, 1.3], "color": "#3d6fd8", "rot": [90, 0, 0]},
        {"shape": "ball", "at": [-0.45, 0.72, -1.7], "size": [0.17], "color": "#3d6fd8"}]
SCREEN_OK = [{"shape": "plane", "at": [0.5, 0.6, -1.842], "size": [0.068, 0.13], "color": "#9fd8ff", "glow": 0.9, "rot": [-12, 0, 0]}]
SCREEN_DEAD = [{"shape": "plane", "at": [0.5, 0.6, -1.842], "size": [0.068, 0.13], "color": "#ff3b30", "glow": 1, "rot": [-12, 0, 0]}]
LAMP = [{"shape": "cyl", "at": [0.62, 0.62, -2.0], "size": [0.05, 0.2], "color": "#3b3f46"},
        {"shape": "cone", "at": [0.62, 0.8, -2.0], "size": [0.13, 0.16], "color": "#ffd68a", "glow": 0.8}]
ALARM_ON = [{"shape": "box", "at": [1.45, 1.4, -2.55], "size": [0.32, 0.42, 0.06], "color": "#e9edf2"},
            {"shape": "ball", "at": [1.45, 1.52, -2.5], "size": [0.05], "color": "#3ddc84", "glow": 1},
            {"shape": "box", "at": [1.45, 1.34, -2.51], "size": [0.22, 0.12, 0.02], "color": "#2b2f36"}]
ALARM_OFF = [{"shape": "box", "at": [1.45, 1.4, -2.55], "size": [0.32, 0.42, 0.06], "color": "#e9edf2"},
             {"shape": "ball", "at": [1.45, 1.52, -2.5], "size": [0.05], "color": "#555b63"},
             {"shape": "box", "at": [1.45, 1.34, -2.51], "size": [0.22, 0.12, 0.02], "color": "#2b2f36"}]

ROCKETS = []
for (rx, ry, rz) in [(-0.02, 1.62, 0.32), (0.56, 1.52, 0.32), (0.5, 1.86, 0.28)]:
    ROCKETS += [{"shape": "cyl", "at": [rx, ry, rz], "size": [0.035, 0.12], "color": "#f4f6f8", "rot": [0, 0, -20]},
                {"shape": "cone", "at": [rx - 0.025, ry + 0.09, rz], "size": [0.035, 0.07], "color": "#ff3b30", "rot": [0, 0, -20]},
                {"shape": "cone", "at": [rx + 0.025, ry - 0.09, rz], "size": [0.028, 0.08], "color": "#ffa62b", "glow": 1, "rot": [180, 0, -20]}]

# a street at night: lamp post, the stranger with a glowing phone
STREET = [
    {"shape": "cyl", "at": [1.1, 1.5, -1.2], "size": [0.05, 3.0], "color": "#2b2f36"},
    {"shape": "ball", "at": [1.1, 3.05, -1.2], "size": [0.17], "color": "#ffcf7a", "glow": 1},
    {"shape": "box", "at": [-1.6, 0.9, -2.2], "size": [1.4, 1.8, 0.8], "color": "#1a1f2b"},
    {"shape": "plane", "at": [-1.6, 1.1, -1.79], "size": [0.4, 0.5], "color": "#ffcf7a", "glow": 0.6},
    {"shape": "box", "at": [0.0, 0.02, 0.0], "size": [6, 0.04, 1.4], "color": "#2a2f3a"},
] + figure(0.0, 0.0) + [
    {"shape": "box", "at": [0.2, 1.3, 0.22], "size": [0.08, 0.15, 0.012], "color": "#11151b"},
    {"shape": "plane", "at": [0.2, 1.3, 0.228], "size": [0.068, 0.13], "color": "#9fd8ff", "glow": 1},
]


def cam(pos, look, fov, push=0.25, dur=70):
    p2 = [pos[0], pos[1], pos[2] - push]
    return [{"pos": pos, "look": look, "fov": fov, "beat": -1}, {"pos": p2, "look": look, "fov": fov, "beat": 0, "dur": dur}]


def tag(text, size=80, y=450, tone=None):
    t = {"text": text, "x": 540, "y": y, "size": size, "pill": True}
    if tone: t["tone"] = tone
    return t


def W(n, **kw):
    d = {"word": n}; d.update(kw); return d


def scene(anchor, beats, props, actions, actors, cam_, mood, theme, tags=None, sfx=None, stamp=None, backdrop="wall"):
    p = {"set": "studio", "mood": mood, "backdrop": backdrop, "props": props, "cam": cam_, "actions": actions, "actors": actors}
    if tags: p["tags"] = tags
    if stamp: p["stamp"] = stamp
    s = {"anchor": anchor, "component": "Actor3D", "transition": "cut", "moving": True, "beats": beats, "theme": theme, "props": p}
    if sfx: s["sfx"] = sfx
    return s


shop_day = SHOP + CARD + figure(-0.55, 0.55)
clerk = A(STONKS, pose="relax")
nosuit = A(SUIT, hidden=True)
bed_suit = A(SUIT, at=[0.55, 0, -0.4], yaw=-0.3)

scenes = [
    # 1 hook: the stranger at the counter, the clerk, the homemade ID
    scene(W(0), [W(0), W(4)], shop_day, ["stonks:relax", "label:0+stonks:think"], [nosuit, clerk],
          cam([0.55, 1.5, 4.3], [-0.2, 1.15, -0.2], 40, 0.4, 120), "day", "light", tags=[tag("HOMEMADE ID", 84)]),
    # 2 close on the card on the counter
    scene(W(10), [W(10)], shop_day, ["stonks:lean"], [nosuit, clerk],
          cam([0.35, 1.55, 1.15], [-0.25, 1.05, 0.0], 34, 0.12, 50), "day", "light",
          sfx=[{"name": "dun", "beat": 0, "offset": 1.0, "gain": 0.45}]),
    # 3 rule one: your bedroom, you on your phone
    scene(W(15), [W(15)], BED + LUMP[:0] + SCREEN_OK + LAMP, ["label:0+suit:scroll"], [A(SUIT, at=[0.3, 0, 0.3], yaw=-0.2), A(STONKS, hidden=True)],
          cam([1.2, 1.5, 4.6], [-0.1, 1.0, -0.8], 36, 0.35, 110), "teal", "light", tags=[tag("RULE ONE", 84)]),
    # 4 you post your balance, with rockets
    scene(W(25), [W(25), W(30)], BED + SCREEN_OK + LAMP + ROCKETS, ["suit:scroll", "suit:proud"], [A(SUIT, at=[0.3, 0, 0.3], yaw=-0.2), A(STONKS, hidden=True)],
          cam([0.65, 1.45, 2.75], [0.25, 1.3, 0.3], 30, 0.15, 60), "teal", "light",
          sfx=[{"name": "whoosh", "beat": 1, "offset": 0.45, "gain": 0.4}]),
    # 5 the stranger tells the shop he's you
    scene(W(32), [W(32)], shop_day, ["stonks:relax"], [nosuit, clerk],
          cam([-1.5, 1.6, 2.6], [0.2, 1.25, -0.6], 34, 0.25, 60), "day", "light"),
    scene(W(39), [W(39)], shop_day, ["stonks:think"], [nosuit, clerk],
          cam([0.7, 1.45, 3.0], [-0.3, 1.2, 0.0], 40, 0.15, 50), "day", "light"),
    # 6 [stonks] Same eyebrows.
    scene(W(44), [W(44)], shop_day, ["stonks:talk:0.8+stonks:point"], [nosuit, A(STONKS, pose="think")],
          cam([0.3, 1.5, 1.35], [0.12, 1.42, -0.75], 30, 0.1, 50), "day", "light",
          sfx=[{"name": "ding", "beat": 0, "offset": 0.85, "gain": 0.35}]),
    # 7 rule two: night, the sleeper and the phone
    scene(W(46), [W(46)], BED + LUMP + SCREEN_OK, ["label:0"], [nosuit, A(STONKS, hidden=True)],
          cam([1.5, 1.6, 2.4], [-0.2, 0.6, -1.3], 38, 0.3, 90), "night", "dark", tags=[tag("RULE TWO", 84)]),
    # 8 midnight, no signal: the phone
    scene(W(54), [W(54), W(55)], BED + LUMP + SCREEN_DEAD, ["shake", "label:0"], [nosuit, A(STONKS, hidden=True)],
          cam([0.75, 0.85, -1.2], [0.5, 0.6, -1.85], 36, 0.08, 60), "night", "dark", tags=[tag("NO SIGNAL", 84, tone="alert")],
          sfx=[{"name": "tick", "beat": 0, "gain": 0.3, "dur": 1.5}]),
    # 9 you go back to sleep (+ pause)
    scene(W(57), [W(57)], BED + LUMP + SCREEN_DEAD, [], [nosuit, A(STONKS, hidden=True)],
          cam([1.7, 1.5, 1.1], [-0.45, 0.6, -1.25], 40, 0.2, 80), "night", "dark",
          sfx=[{"name": "crickets", "beat": 0, "offset": 0.9, "gain": 0.35, "dur": 1.3}]),
    # 10 your number rings on his phone: the street
    scene(W(62), [W(62)], STREET, ["shake"], [nosuit, A(STONKS, hidden=True)],
          cam([0.9, 1.35, 3.6], [0.05, 1.1, 0.0], 32, 0.3, 60), "night", "dark", backdrop="sky"),
    scene(W(69), [W(69)], STREET, ["mood:doom"], [nosuit, A(STONKS, hidden=True)],
          cam([-0.6, 1.5, 1.9], [0.15, 1.3, 0.2], 32, 0.15, 60), "night", "dark", backdrop="sky"),
    # 11 email, exchange, bank: his phone, closer, a ding each
    scene(W(75), [W(75), W(76), W(77)], STREET, ["mood:doom", "mood:doom", "stamp"], [nosuit, A(STONKS, hidden=True)],
          cam([0.45, 1.35, 1.3], [0.15, 1.3, 0.2], 30, 0.15, 60), "doom", "dark", backdrop="sky",
          stamp={"text": "RESET", "x": 540, "y": 1450, "size": 150, "tone": "alert", "rot": -6},
          sfx=[{"name": "ding", "beat": 0, "gain": 0.35}, {"name": "ding", "beat": 1, "gain": 0.4}]),
    # 12 [suit] Well, shit.
    scene(W(78), [W(78)], BED + SCREEN_DEAD, ["suit:talk:0.9+suit:facepalm"], [bed_suit, A(STONKS, hidden=True)],
          cam([0.9, 1.45, 2.0], [0.5, 1.4, -0.4], 30, 0.1, 50), "doom", "dark",
          sfx=[{"name": "trombone", "beat": 0, "offset": 0.9, "gain": 0.35}]),
]

# 13 the receipt: DOJ release
scenes.append({"anchor": W(80), "component": "Shot", "theme": "light", "transition": "zoom", "long": True,
               "beats": [W(80), W(82), W(83), W(85), W(89), W(94), W(98), W(100)],
               "props": {"src": "doj_receipt.png", "chrome": "browser", "width": 940, "maxHeight": 1250,
                         "url": "justice.gov/usao-dc/pr/alabama-man-sentenced-hack-sec-x-account-spiked-value-bitcoin",
                         "source": "US Justice Department · 16 May 2025",
                         "cam": [{"x": 0.5, "y": 0.08, "zoom": 1.15}, {"x": 0.35, "y": 0.72, "zoom": 1.5}, {"x": 0.3, "y": 0.73, "zoom": 1.7},
                                 {"x": 0.4, "y": 0.83, "zoom": 1.55}, {"x": 0.55, "y": 0.85, "zoom": 1.35},
                                 {"x": 0.5, "y": 0.76, "zoom": 1.25}, {"x": 0.5, "y": 0.73, "zoom": 1.4},
                                 {"x": 0.5, "y": 0.35, "zoom": 1.15}],
                         "marks": [{"beat": 1, "kind": "box", "x": 55, "y": 1190, "w": 350, "h": 58},
                                   {"beat": 3, "kind": "underline", "x": 150, "y": 1378, "w": 620, "h": 48}]}})

# 14 fake bitcoin news went out: the stranger reads it, lamp-lit street
scenes.append(scene(W(102), [W(102)], STREET, ["shake"], [nosuit, A(STONKS, hidden=True)],
                    cam([-0.9, 1.5, 3.2], [0.05, 1.2, 0.0], 34, 0.3, 70), "doom", "dark", backdrop="sky"))
# 15 rule three: the alarm panel, green
scenes.append(scene(W(107), [W(107), W(109)], BED + SCREEN_OK + ALARM_ON + LAMP, ["label:0", "suit:point"],
                    [A(SUIT, at=[0.95, 0, -1.6], yaw=2.6), A(STONKS, hidden=True)],
                    cam([0.0, 1.55, 1.6], [1.25, 1.35, -2.2], 36, 0.2, 70), "night", "dark", tags=[tag("RULE THREE", 80)]))
# 16 the SEC had it off: the panel, dark; you shrug
scenes.append(scene(W(114), [W(114), W(119)], BED + SCREEN_OK + ALARM_OFF + LAMP, ["suit:shrug", "label:0"],
                    [A(SUIT, at=[0.95, 0, -1.6], yaw=0.3), A(STONKS, hidden=True)],
                    cam([1.6, 1.5, 0.6], [1.25, 1.3, -2.1], 34, 0.15, 70), "night", "dark", tags=[tag("LOGIN CODE: OFF", 64)]))
# 17 somewhere, another stranger: the shop at night, Stonks squints at a new card
shop_night = SHOP + CARD + figure(-0.6, 0.55, hat="#3a1a1f")
scenes.append(scene(W(124), [W(124), W(130, at="end", plus=0.3)], shop_night, ["stonks:think", "stonks:lean"],
                    [nosuit, A(STONKS, pose="think")],
                    cam([1.1, 1.45, 3.6], [-0.35, 1.15, -0.1], 38, 0.3, 120), "night", "dark",
                    sfx=[{"name": "dun", "beat": 1, "gain": 0.45}]))
# 18 the step, held: you on the phone to your carrier, lamp on
scenes.append(scene(W(131), [W(131), W(137)], BED + LUMP[:0] + SCREEN_OK + LAMP, ["suit:phone", "label:0"],
                    [A(SUIT, at=[0.3, 0, 0.3], yaw=-0.15), A(STONKS, hidden=True)],
                    cam([0.6, 1.4, 3.0], [0.25, 1.25, 0.2], 32, 0.15, 90), "teal", "light", tags=[tag("LOCK YOUR NUMBER", 60)]))

sb = {"slug": "no-signal", "format": "skit", "genre": "horror", "bit": "rules-of-horror", "topic_source": "plan",
      "theme": "light", "tail": 0.6,
      "emphasis": ["homemade ID", "your number.", "rule one:", "the woods", "treasure.", "with rockets.", "he's you,", "new SIM.",
                   "Same eyebrows.", "Rule two:", "stay awake.", "No signal.", "back to sleep.", "his phone.", "reset codes.",
                   "Well, shit.", "True story,", "fake ID", "fake bitcoin news", "Rule three:", "switched off.", "another stranger",
                   "lock your number."],
      "scenes": scenes}
json.dump(sb, open("episodes/2026-11-25-no-signal/storyboard.json", "w"), indent=1)
print(len(scenes), "scenes")
