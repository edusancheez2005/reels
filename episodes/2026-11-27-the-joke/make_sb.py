import json

EP = "episodes/2026-11-27-the-joke"
SUIT = {"id": "suit", "model": "Bizdude.vrm", "at": [0, 0, 0], "tall": 1.75, "pose": "type"}
STONKS = {"id": "stonks", "model": "StonksReporter.vrm", "at": [0.62, 0, 0.15], "yaw": -0.5, "tall": 1.6, "pose": "relax"}
NOSTONKS = dict(STONKS, hidden=True)


def A(base, **kw):
    d = dict(base); d.update(kw); return d


def W(n, **kw):
    d = {"word": n}; d.update(kw); return d


def cam(pos, look, fov, push=0.25, dur=70):
    p2 = [pos[0], pos[1], pos[2] - push]
    return [{"pos": pos, "look": look, "fov": fov, "beat": -1}, {"pos": p2, "look": look, "fov": fov, "beat": 0, "dur": dur}]


def tag(text, size=84, y=450, tone=None):
    t = {"text": text, "x": 540, "y": y, "size": size, "pill": True}
    if tone: t["tone"] = tone
    return t


GOLD, FACE_C = "#f0b232", "#ffd166"


def coin(x, y, z, r, glow=0.25, yaw=0):
    """an upright coin facing the camera: a gold rim, a lighter face, a raised dog-ish disc in the middle"""
    t = max(0.012, r * 0.14)
    return [{"shape": "cyl", "at": [x, y, z], "size": [r, t], "color": GOLD, "rot": [90, yaw, 0], "glow": glow},
            {"shape": "cyl", "at": [x, y, z + t * 0.55], "size": [r * 0.82, t * 0.2], "color": FACE_C, "rot": [90, yaw, 0], "glow": glow},
            {"shape": "cyl", "at": [x, y + r * 0.05, z + t * 0.7], "size": [r * 0.42, t * 0.2], "color": "#c98a1c", "rot": [90, yaw, 0], "glow": glow},
            {"shape": "cone", "at": [x - r * 0.28, y + r * 0.42, z + t * 0.7], "size": [r * 0.13, r * 0.26], "color": "#c98a1c", "glow": glow},
            {"shape": "cone", "at": [x + r * 0.28, y + r * 0.42, z + t * 0.7], "size": [r * 0.13, r * 0.26], "color": "#c98a1c", "glow": glow}]


DESKTOP = 0.745
LAMP = [{"shape": "cyl", "at": [-0.66, 0.77, 0.5], "size": [0.07, 0.03], "color": "#2a2f3a"},
        {"shape": "cyl", "at": [-0.66, 0.95, 0.5], "size": [0.012, 0.36], "color": "#2a2f3a"},
        {"shape": "cone", "at": [-0.66, 1.14, 0.53], "size": [0.1, 0.12], "color": "#ffcf7a", "glow": 1}]
WINDOW = [{"shape": "plane", "at": [-1.1, 1.6, -1.45], "size": [0.9, 0.7], "color": "#1b2a52", "glow": 0.4},
          {"shape": "box", "at": [-1.1, 1.6, -1.44], "size": [0.04, 0.72, 0.02], "color": "#d9d4c7"},
          {"shape": "box", "at": [-1.1, 1.6, -1.44], "size": [0.92, 0.04, 0.02], "color": "#d9d4c7"},
          {"shape": "ball", "at": [-0.85, 1.78, -1.46], "size": [0.06], "color": "#fff6d8", "glow": 1}]
HOME = LAMP + WINDOW
HOODIES = [{"shape": "box", "at": [0.64, 0.79 + i * 0.065, 0.72], "size": [0.3, 0.06, 0.2], "color": c}
           for i, c in enumerate(["#f0b232", "#3bc9ee", "#f0b232", "#ff5b6b", "#f0b232"])]

SCREENS = {
    "blank": {"head": "NEW FILE", "big": "…", "tone": "white", "sub": "Saturday"},
    "site": {"head": "DOGECOIN.COM", "big": "WOW", "tone": "warm", "sub": "a coin that doesn't exist"},
    "code": {"head": "ANOTHER COIN'S CODE", "big": "COPY", "tone": "white", "sub": "ctrl+c · ctrl+v"},
    "dog": {"head": "FIND & REPLACE", "big": "→ DOG", "tone": "warm", "sub": "coin name: Dogecoin"},
    "mint": {"head": "NEW COINS", "big": "+5B", "tone": "warm", "sub": "every year · no limit"},
    "ask": {"head": "BEFORE YOU BUY", "big": "WHO?", "tone": "white", "sub": "who'd buy it from you?"},
}


def desk(anchor, beats, actions, cam_, mood, theme, props=None, tags=None, sfx=None, stamp=None, screen="blank",
         actors=None, shift=None, long=False, backdrop=None):
    p = {"set": "desk", "mood": mood, "props": props or [], "cam": cam_, "actions": actions,
         "actors": actors or [SUIT, NOSTONKS], "screens": SCREENS, "screen": screen}
    if backdrop: p["backdrop"] = backdrop
    if tags: p["tags"] = tags
    if stamp: p["stamp"] = stamp
    if shift: p["shift"] = shift
    s = {"anchor": anchor, "component": "Actor3D", "transition": "cut", "moving": True, "beats": beats, "theme": theme, "props": p}
    if sfx: s["sfx"] = sfx
    if long: s["long"] = True
    return s


def out(anchor, beats, props, actions, cam_, mood, theme, actors, tags=None, sfx=None, stamp=None, long=False):
    p = {"set": "studio", "mood": mood, "backdrop": "sky", "props": props, "cam": cam_, "actions": actions, "actors": actors}
    if tags: p["tags"] = tags
    if stamp: p["stamp"] = stamp
    s = {"anchor": anchor, "component": "Actor3D", "transition": "cut", "moving": True, "beats": beats, "theme": theme, "props": p}
    if sfx: s["sfx"] = sfx
    if long: s["long"] = True
    return s


FACE = [0.3, 1.52, 2.35], [0, 1.5, 0], 30
FP = [0, 1.4, 0.07], [0, 0.92, 0.82], 74
WIDE = [2.0, 1.55, 3.6], [0.2, 1.0, 0.25], 40
BOTH = [0.6, 1.36, 3.15], [0.22, 1.42, 0], 38

# the coin on the desk, growing scene by scene (it gets out of hand)
c_tiny = coin(0.38, DESKTOP + 0.08, 1.0, 0.08, glow=0.4)
c_small = coin(0.4, DESKTOP + 0.14, 1.0, 0.14, glow=0.4)
c_mid = coin(-0.5, DESKTOP + 0.17, 0.9, 0.17)
c_big = coin(-1.25, 0.55, 0.55, 0.55)
c_bigger = coin(-1.35, 0.85, 0.35, 0.85)
c_flash = coin(0.0, 1.55, -1.75, 1.5, glow=0.6)

# outdoors: the bobsled run in the snow (Jamaica's colours)
SLED = [{"shape": "box", "at": [0.0, 0.28, 0.9], "size": [0.62, 0.36, 1.7], "color": "#1f9d55"},
        {"shape": "box", "at": [0.0, 0.47, 0.9], "size": [0.64, 0.05, 1.72], "color": "#f0c419"},
        {"shape": "cone", "at": [0.0, 0.28, 1.95], "size": [0.31, 0.45], "color": "#1f9d55", "rot": [90, 0, 0]},
        {"shape": "box", "at": [-0.24, 0.05, 0.9], "size": [0.05, 0.06, 1.9], "color": "#1b1b1b"},
        {"shape": "box", "at": [0.24, 0.05, 0.9], "size": [0.05, 0.06, 1.9], "color": "#1b1b1b"}]
TRACK = [{"shape": "box", "at": [-0.75, 0.2, 0.0], "size": [0.18, 0.4, 9.0], "color": "#eef6ff"},
         {"shape": "box", "at": [0.75, 0.2, 0.0], "size": [0.18, 0.4, 9.0], "color": "#eef6ff"},
         {"shape": "box", "at": [0.0, 0.005, 0.0], "size": [1.4, 0.01, 9.0], "color": "#dfeefc"}]
TREES = []
for x, z in ((-2.6, -2.5), (-3.2, -0.6), (2.7, -2.2), (3.3, -0.2), (-2.2, -4.5), (2.4, -4.8)):
    TREES += [{"shape": "cone", "at": [x, 1.0, z], "size": [0.55, 1.6], "color": "#2f6b4a"},
              {"shape": "cone", "at": [x, 1.65, z], "size": [0.32, 0.8], "color": "#f4f8ff"}]
SNOW = SLED + TRACK + TREES

# outdoors: a street at dusk with one used Honda-ish hatchback (no badge)
CAR = [{"shape": "box", "at": [0.95, 0.4, 0.25], "size": [1.8, 0.42, 0.82], "color": "#b5c3d3"},
       {"shape": "box", "at": [0.8, 0.79, 0.25], "size": [0.95, 0.36, 0.76], "color": "#a3b2c3"},
       {"shape": "box", "at": [0.6, 0.8, 0.64], "size": [0.4, 0.26, 0.01], "color": "#20303f"}, {"shape": "box", "at": [1.06, 0.8, 0.64], "size": [0.36, 0.26, 0.01], "color": "#20303f"}, {"shape": "box", "at": [0.06, 0.47, 0.25], "size": [0.02, 0.1, 0.7], "color": "#ff3b3b", "glow": 0.6},
       {"shape": "box", "at": [1.81, 0.47, 0.25], "size": [0.02, 0.12, 0.7], "color": "#ffe6a8", "glow": 0.5}]
for x in (0.4, 1.5):
    for z in (-0.17, 0.67):
        CAR.append({"shape": "cyl", "at": [x, 0.19, z], "size": [0.19, 0.12], "color": "#16181c", "rot": [90, 0, 0]})
LAMPPOST = [{"shape": "cyl", "at": [-1.9, 1.4, -0.8], "size": [0.04, 2.8], "color": "#2a2f3a"},
            {"shape": "ball", "at": [-1.9, 2.82, -0.8], "size": [0.13], "color": "#ffd9a0", "glow": 1}]
KERB = [{"shape": "box", "at": [0, 0.06, -1.2], "size": [8.0, 0.12, 0.4], "color": "#7b8088"}]
HOUSES = [{"shape": "box", "at": [x, 0.9, -3.4], "size": [1.6, 1.8, 1.2], "color": c} for x, c in
          ((-2.6, "#6b5d7a"), (-0.8, "#7a6a5d"), (1.0, "#5d6b7a"), (2.8, "#7a5d66"))]
STREET = CAR + LAMPPOST + KERB
MOON_COIN = coin(-0.4, 3.0, -6.5, 2.6, glow=0.9)
SMALL_MOON = coin(0.5, 2.4, -3.5, 0.3, glow=0.3)

SUIT_ST = A(SUIT, at=[-0.55, 0, 0.35], yaw=0.35, pose="relax")
STONKS_ST = A(STONKS, at=[0.45, 0, 1.15], yaw=-0.6)

scenes = [
    # 1 hook: a home office at night, Dec 2013; the tiny coin on the desk; the number in the first second
    desk(W(0), [W(0), W(4)], ["label:0+suit:type", "suit:type"], cam([0.7, 1.3, 2.8], [-0.15, 1.1, 0.4], 38, push=0.2, dur=90),
         "night", "dark", props=HOME + c_tiny, tags=[tag("OVER $85B", 104, tone="warm")], screen="blank"),
    # 2 it ends up worth over 85 billion: a flash-forward, the same room with a coin the size of the wall
    desk(W(8), [W(8), W(13)], ["suit:type", "suit:look:-25+suit:panic"], cam(*WIDE, push=0.35, dur=90), "night", "dark",
         props=LAMP + c_flash, screen="blank", sfx=[{"name": "dun", "beat": 1, "offset": 0.2, "gain": 0.4}]),
    # 3 December 2013. (title card feel: the window, the lamp, him typing)
    desk(W(16), [W(16)], ["label:0+suit:type"], cam([1.6, 1.7, 2.6], [-0.3, 1.2, -0.3], 40, push=0.2, dur=60), "night", "dark",
         props=HOME + c_tiny, screen="blank", tags=[tag("DEC 2013", 84)]),
    # 4 your mate has a website for a fake coin with a dog on it: Stonks walks in, phone out; the monitor shows his site
    desk(W(18), [W(18), W(22)], ["stonks:in+stonks:scroll", "screen:site+suit:lean"], cam(*BOTH, push=0.2, dur=80), "night", "dark",
         props=HOME + c_tiny, screen="blank", actors=[SUIT, STONKS]),
    # 5 [stonks] Hoodies printed. (a pile of coin-coloured hoodies by his feet)
    desk(W(32), [W(32)], ["stonks:talk:0.8+stonks:proud"], cam([0.8, 1.3, 2.7], [0.6, 1.05, 0.4], 36, push=0.15, dur=50),
         "night", "dark", props=HOME + HOODIES + c_tiny, screen="site", actors=[SUIT, STONKS]),
    # 6 you copy another coin's code and swap in the dog: first person at the screen
    desk(W(34), [W(34), W(40)], ["suit:type+screen:code", "suit:click+screen:dog"], cam(*FP, push=0.05, dur=90), "night", "dark",
         props=HOME, screen="site", shift=60, sfx=[{"name": "ding", "beat": 1, "offset": 0.5, "gain": 0.3}]),
    # 7 [stonks] Told my mum. (on the phone; the coin has grown)
    desk(W(44), [W(44)], ["stonks:phone+stonks:talk:0.8"], cam([0.2, 1.45, 2.4], [0.45, 1.35, 0.1], 30, push=0.12, dur=40),
         "night", "dark", props=HOME + HOODIES + c_small, screen="dog", actors=[SUIT, STONKS]),
    # 8 six weeks in, it helps send Jamaica's bobsled team to the Olympics (+pause): the snow, the sled, the coin now big
    out(W(47), [W(47), W(53), W(58, at="end", plus=0.25)], SNOW + coin(0.0, 0.62, -1.4, 0.6, glow=0.4),
        ["label:0+stonks:point", "stonks:cheer", "stonks:wave+suit:think"],
        cam([0.0, 1.9, 8.4], [0, 0.85, 1.0], 38, push=0.4, dur=120), "day", "light",
        [A(SUIT, at=[-0.8, 0, 3.0], yaw=0.3, pose="relax"), A(STONKS, at=[0.8, 0, 3.1], yaw=-0.3)],
        tags=[tag("SOCHI 2014", 84)], long=True,
        sfx=[{"name": "whoosh", "beat": 2, "offset": 0.0, "gain": 0.4}]),
    # 9 no limit. five billion new coins a year, forever: back home, the monitor printing coins, the coin bigger again
    desk(W(59), [W(59), W(61)], ["screen:mint+suit:think", "label:0"], cam([-1.6, 1.6, 3.3], [-0.4, 1.0, 0.2], 38, push=0.25, dur=80),
         "pink", "dark", props=HOME + HOODIES + c_big, screen="dog", actors=[SUIT, STONKS],
         tags=[tag("+5B A YEAR", 84)], sfx=[{"name": "cash", "beat": 1, "offset": 0.6, "gain": 0.3}]),
    # 10 [suit] Is it bigger?
    desk(W(68), [W(68)], ["suit:talk:0.7+suit:look:-30"], cam([0.15, 1.5, 2.0], [-0.1, 1.45, 0], 30, push=0.1, dur=40),
         "pink", "dark", props=HOME + HOODIES + c_big, screen="mint", actors=[SUIT, STONKS]),
    # 11 [stonks] It's bulking. (cut: it is bigger)
    desk(W(71), [W(71)], ["stonks:talk:0.6+stonks:proud"], cam([-0.2, 1.55, 3.6], [-0.5, 1.1, 0.2], 40, push=0.2, dur=50),
         "pink", "dark", props=HOME + HOODIES + c_bigger, screen="mint", actors=[SUIT, STONKS],
         sfx=[{"name": "boom", "beat": 0, "offset": 0.55, "gain": 0.3}]),
    # 12 2015. laid off: a street at dusk, one used hatchback
    out(W(73), [W(73), W(74)], STREET, ["suit:slump", "stamp"], cam([0.3, 1.5, 6.4], [0.2, 0.9, 0], 34, push=0.3, dur=60),
        "pink", "dark", [SUIT_ST, A(STONKS, hidden=True)],
        stamp={"text": "LAID OFF", "x": 540, "y": 1450, "size": 140, "tone": "alert", "rot": -6}),
    # 13 you sell all of yours for about a used Honda Civic (+pause): he hands over the coin, gets the car
    out(W(76), [W(76), W(84), W(86, at="end", plus=0.3)], STREET, ["suit:relax", "label:0+suit:point", "suit:shrug"],
        cam([2.0, 1.4, 5.4], [0.4, 0.85, 0.2], 34, push=0.25, dur=90), "pink", "dark", [SUIT_ST, A(STONKS, hidden=True)],
        tags=[tag("1 USED CIVIC", 84)], long=True,
        sfx=[{"name": "cash", "beat": 1, "offset": 0.4, "gain": 0.3}]),
    # 14 May 2021: the same street at night; the coin has risen over the town like a moon
    out(W(87), [W(87)], STREET + MOON_COIN, ["suit:relax"], cam([0.8, 1.0, 7.4], [0.0, 2.0, -2.0], 40, push=0.3, dur=60),
        "night", "dark", [SUIT_ST, A(STONKS, hidden=True)], sfx=[{"name": "dun", "beat": 0, "offset": 0.2, "gain": 0.35}]),
    # 15 the joke is worth more than FedEx
    out(W(89), [W(89), W(95)], STREET + MOON_COIN, ["suit:look:-15", "label:0+suit:think"],
        cam([-1.6, 1.2, 5.0], [0.2, 1.8, -2.0], 38, push=0.25, dur=70), "night", "dark", [SUIT_ST, A(STONKS, hidden=True)],
        tags=[tag("> FEDEX", 96, tone="warm")]),
    # 16 the Civic is still a Civic. (low, on the little car)
    out(W(96), [W(96), W(101, at="end", plus=0.1)], STREET + MOON_COIN, ["suit:slump", "suit:slump"],
        cam([2.4, 0.9, 3.8], [0.5, 0.75, 0.3], 44, push=0.15, dur=60), "night", "dark", [SUIT_ST, A(STONKS, hidden=True)],
        sfx=[{"name": "crickets", "beat": 1, "gain": 0.3, "dur": 0.6}]),
    # 17 [stonks] Nice car.
    out(W(102), [W(102), W(103, at="end", plus=0.1)], STREET + MOON_COIN, ["stonks:in+stonks:talk:0.6+stonks:point", "stonks:proud"],
        cam([0.0, 1.35, 4.7], [0.0, 1.2, 0.7], 30, push=0.12, dur=40), "night", "dark", [SUIT_ST, STONKS_ST],
        sfx=[{"name": "rimshot", "beat": 1, "gain": 0.35}]),
]

# 18 the receipt: the real article (Cointelegraph, 12 Feb 2021)
scenes.append({"anchor": W(104), "component": "Shot", "theme": "light", "transition": "zoom", "long": True,
               "beats": [W(104), W(107), W(110), W(114), W(117)],
               "props": {"src": "receipt.png", "chrome": "browser", "width": 940,
                         "url": "cointelegraph.com/news/founder-of-8-4b-dogecoin-sold-everything-in-2015-for-a-used-honda-civic",
                         "source": "Cointelegraph · 12 Feb 2021",
                         "cam": [{"x": 0.5, "y": 0.5, "zoom": 1.0}, {"x": 0.5, "y": 0.4, "zoom": 1.05},
                                 {"x": 0.5, "y": 0.6, "zoom": 1.0}, {"x": 0.45, "y": 0.55, "zoom": 1.08},
                                 {"x": 0.42, "y": 0.58, "zoom": 1.15}],
                         "marks": [{"beat": 1, "kind": "underline", "x": 680, "y": 190, "w": 345, "h": 26},
                                   {"beat": 3, "kind": "circle", "x": 30, "y": 290, "w": 470, "h": 100}]}})
# 19 same dog. same code. only the crowd changed: the moon coin, both of them looking up
scenes.append(out(W(120), [W(120), W(122), W(124)], STREET + MOON_COIN, ["suit:look:-20", "stonks:look:-20", "stonks:shrug"],
                  cam([1.2, 0.9, 6.6], [0.0, 2.2, -2.5], 42, push=0.3, dur=100), "night", "dark",
                  [SUIT_ST, STONKS_ST], long=True))
# 20 crowds leave: cut, the coin in the sky is small again
scenes.append(out(W(128), [W(128), W(129, at="end", plus=0.1)], STREET + SMALL_MOON, ["suit:slump", "stonks:shrug"],
                  cam([1.0, 0.9, 6.4], [0.0, 1.9, -2.5], 42, push=0.15, dur=40), "night", "dark", [SUIT_ST, STONKS_ST],
                  sfx=[{"name": "trombone", "beat": 1, "gain": 0.3}]))
# 21 the step, held: morning, back at the desk, the monitor asks the question
scenes.append(desk(W(130), [W(130)], ["suit:think"], cam([0.3, 1.48, 2.6], [0, 1.3, 0.3], 34, push=0.2, dur=60),
                   "day", "light", props=LAMP + c_tiny, screen="blank"))
scenes.append(desk(W(135), [W(135)], ["screen:ask+suit:type"], cam(*FP, push=0.04, dur=120), "day", "light",
                   props=LAMP, screen="blank", shift=60, long=True))

sb = {"slug": "the-joke", "format": "skit", "genre": "origin", "bit": "it-gets-out-of-hand", "topic_source": "plan",
      "theme": "dark", "tail": 1.6,
      "emphasis": ["joke coin", "two hours.", "eighty-five billion", "a dog", "Hoodies printed.", "swap in the dog.",
                   "Told my mum.", "bobsled team", "No limit.", "Five billion", "Is it bigger?", "It's bulking.",
                   "Laid off,", "used Honda Civic.", "FedEx.", "still a Civic.", "Nice car.", "Billy Markus",
                   "Jackson Palmer.", "Crowds leave.", "who'd buy it"],
      "scenes": scenes}
json.dump(sb, open(EP + "/storyboard.json", "w"), indent=1)
print(len(scenes), "scenes")
