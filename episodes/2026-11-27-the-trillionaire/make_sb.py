import json

EP = "episodes/2026-11-27-the-trillionaire"
BIZ, STK = "Bizdude.vrm", "StonksReporter.vrm"


def W(n, **kw):
    d = {"word": n}; d.update(kw); return d


def cam(pos, look, fov, push=0.25, dur=70):
    p2 = [pos[0] + (look[0] - pos[0]) * push / 4, pos[1], pos[2] - push]
    return [{"pos": pos, "look": look, "fov": fov, "beat": -1}, {"pos": p2, "look": look, "fov": fov, "beat": 0, "dur": dur}]


def tag(text, size=84, y=450, tone=None, raw=False):
    t = {"text": text, "x": 540, "y": y, "size": size, "pill": True}
    if tone: t["tone"] = tone
    if raw: t["raw"] = True
    return t


def box(at, size, color, glow=None, rot=None):
    d = {"shape": "box", "at": at, "size": size, "color": color}
    if glow: d["glow"] = glow
    if rot: d["rot"] = rot
    return d


def cyl(at, size, color, rot=None, glow=None):
    d = {"shape": "cyl", "at": at, "size": size, "color": color}
    if rot: d["rot"] = rot
    if glow: d["glow"] = glow
    return d


NOTE_BLUE = ("#8fd3cf", "#dff3ea", "#2f5f8a", "#1d4d6b")
NOTE_GREEN = ("#a9d79a", "#e9f5dc", "#3f7a45", "#2c5a33")


def note(x, y, z, w, pal=NOTE_BLUE):
    """a banknote facing the camera: a coloured sheet, a pale panel, three balancing rocks, two number strips"""
    edge, panel, rock, strip = pal
    h, t = w / 2, 0.004
    f = [x, y, z]
    return [box(f, [w, h, t], edge, glow=0.9),
            box([x + 0.02 * w, y, z + t], [w * 0.9, h * 0.8, t], panel, glow=0.95),
            cyl([x + 0.1 * w, y - 0.11 * w, z + 2 * t], [0.1 * w, t], rock, rot=[90, 0, 0], glow=0.9),
            cyl([x + 0.08 * w, y + 0.02 * w, z + 2 * t], [0.075 * w, t], rock, rot=[90, 0, 0], glow=0.9),
            cyl([x + 0.11 * w, y + 0.125 * w, z + 2 * t], [0.055 * w, t], rock, rot=[90, 0, 0], glow=0.9),
            box([x - 0.24 * w, y + 0.155 * w, z + 2 * t], [0.34 * w, 0.045 * w, t], strip, glow=0.9),
            box([x + 0.3 * w, y - 0.16 * w, z + 2 * t], [0.26 * w, 0.045 * w, t], strip, glow=0.9),
            box([x - 0.24 * w, y - 0.02 * w, z + 2 * t], [0.3 * w, 0.03 * w, t], rock, glow=0.9),
            box([x - 0.24 * w, y - 0.08 * w, z + 2 * t], [0.22 * w, 0.03 * w, t], rock, glow=0.9)]


def flat_note(x, y, z, w, pal=NOTE_BLUE):
    edge, panel, rock, strip = pal
    return [box([x, y, z], [w, 0.004, w / 2], edge), box([x, y + 0.003, z], [w * 0.9, 0.004, w * 0.4], panel),
            cyl([x + 0.1 * w, y + 0.006, z], [0.1 * w, 0.004], rock),
            box([x - 0.24 * w, y + 0.006, z - 0.15 * w], [0.34 * w, 0.004, 0.045 * w], strip)]


def stack(x, z, h, base=0.0, w=0.3):
    """a pile of banknotes"""
    return [box([x, base + h / 2, z], [w, h, w / 2], "#8fd3cf"), box([x, base + h + 0.003, z], [w * 0.9, 0.006, w * 0.42], "#dff3ea"),
            box([x, base + h / 2, z + w / 4 + 0.002], [w * 0.2, h, 0.004], "#f4efe2")]


# ---------------------------------------------------------------- the street: a bus, a stop, a market stall
BUS = [box([0.8, 1.45, -2.6], [5.0, 1.9, 1.6], "#f4efe2"),
       box([0.8, 0.78, -2.6], [5.03, 0.56, 1.63], "#2b6cb0"),
       box([0.8, 2.43, -2.6], [4.8, 0.08, 1.4], "#d9d4c7"),
       box([-0.6, 1.25, -1.78], [0.8, 1.6, 0.04], "#16222e"),
       box([-1.35, 2.2, -1.78], [0.6, 0.2, 0.04], "#ffb23e", glow=0.8),
       box([0.8, 0.3, -2.6], [4.6, 0.3, 1.5], "#1b1e23")]
for x in (0.45, 1.3, 2.15, 3.0):
    BUS.append(box([x, 1.75, -1.785], [0.7, 0.62, 0.03], "#22384a"))
for x in (-1.1, 2.6):
    BUS.append(cyl([x, 0.4, -1.85], [0.4, 0.3], "#15171a", rot=[90, 0, 0]))
    BUS.append(cyl([x, 0.4, -1.69], [0.17, 0.02], "#b9bec4", rot=[90, 0, 0]))
STOP = [cyl([1.75, 1.3, -0.7], [0.035, 2.6], "#3a3f48"), box([1.75, 2.45, -0.7], [0.5, 0.5, 0.05], "#2b6cb0"),
        box([1.75, 2.45, -0.67], [0.34, 0.2, 0.02], "#f4efe2"), cyl([1.75, 2.38, -0.655], [0.035, 0.01], "#15171a", rot=[90, 0, 0])]
ROAD = [box([0, 0.01, -3.0], [40, 0.02, 4.2], "#5c6066"), box([0, 0.05, -0.85], [40, 0.1, 0.18], "#b9b3a6")]
TOWN = [box([x, h / 2, -8.5], [2.6, h, 2.0], c) for x, h, c in
        ((-9, 3.2, "#c98f6b"), (-6, 4.4, "#e3c9a1"), (-3, 2.8, "#b7c9a8"), (0, 3.8, "#d9a48a"), (3, 3.0, "#e8d7b0"),
         (6, 4.6, "#c7b29b"), (9, 3.4, "#b9c7d6"), (12, 4.0, "#e3c9a1"))]
SX = 8.0  # the market stall
STALL = [box([SX, 0.45, -0.6], [1.7, 0.9, 0.6], "#9a6b3f"), box([SX, 0.92, -0.6], [1.8, 0.05, 0.7], "#7a5230"),
         box([SX, 2.2, -0.5], [2.0, 0.08, 1.1], "#d1433a"), box([SX, 2.12, 0.04], [2.0, 0.16, 0.03], "#f4efe2"),
         cyl([SX - 0.9, 1.1, -0.1], [0.03, 2.2], "#5a4a3a"), cyl([SX + 0.9, 1.1, -0.1], [0.03, 2.2], "#5a4a3a")]
GOODS = []
for i in range(4):  # loaves
    GOODS += [box([SX - 0.6 + i * 0.2, 1.02, -0.72], [0.17, 0.11, 0.3], "#b9772e"),
              cyl([SX - 0.6 + i * 0.2, 1.075, -0.72], [0.085, 0.3], "#c98a3a", rot=[90, 0, 0])]
for i in range(6):  # oranges
    GOODS.append({"shape": "ball", "at": [SX + 0.3 + (i % 3) * 0.13, 1.01 + (i // 3) * 0.1, -0.5 + (i // 3) * 0.03], "size": [0.06], "color": "#f08a24"})
for i in range(5):  # tins
    GOODS.append(cyl([SX - 0.65 + i * 0.14, 1.02, -0.42], [0.05, 0.14], ["#d1433a", "#f2c230", "#2b6cb0", "#d1433a", "#3f7a45"][i]))
GOODS += [box([SX + 0.55, 1.07, -0.75], [0.3, 0.24, 0.2], "#e9e2cf"), box([SX + 0.2, 1.0, -0.78], [0.22, 0.1, 0.16], "#6f4a8e")]
STREET = BUS + STOP + ROAD + TOWN + STALL + GOODS
HX = -9.0  # the hero-note spot (a note held up against the sky)

DRIVER = {"id": "suit", "model": BIZ, "tall": 1.75, "at": [-0.6, 0, -1.3], "yaw": 0.2, "pose": "relax"}
FRIEND = {"id": "stonks", "model": STK, "tall": 1.6, "at": [0.62, 0, 0.2], "yaw": -0.3, "pose": "think"}
KEEPER = dict(DRIVER, at=[SX, 0, -1.2], yaw=0.0)
SHOPPER = dict(FRIEND, at=[SX + 0.95, 0, 0.1], yaw=-0.7)


def H(a): return dict(a, hidden=True)


def sc(anchor, beats, props, actions, cam_, mood, theme, actors, backdrop="sky", tags=None, sfx=None, stamp=None, long=False,
       transition="cut"):
    p = {"set": "studio", "mood": mood, "backdrop": backdrop, "props": props, "cam": cam_, "actions": actions, "actors": actors}
    if tags: p["tags"] = tags
    if stamp: p["stamp"] = stamp
    s = {"anchor": anchor, "component": "Actor3D", "transition": transition, "moving": True, "beats": beats, "theme": theme, "props": p}
    if sfx: s["sfx"] = sfx
    if long: s["long"] = True
    return s


POV = note(0.1, 1.36, 5.25, 0.34)  # your note, held up in front of the camera at the stop
WIDE = [0.25, 1.6, 7.0], [0.15, 1.25, -1.0], 36

# ---------------------------------------------------------------- inside the bus
BUSIN = [box([x, 1.75, -2.55], [1.0, 0.7, 0.04], "#cfeeff", glow=0.7) for x in (-1.3, 0.0, 1.3)]
BUSIN += [box([0, 2.25, 0.2], [0.04, 0.04, 4.0], "#f2c230"), cyl([-0.62, 1.15, -0.6], [0.022, 2.3], "#f2c230"), cyl([0.72, 1.15, 0.5], [0.022, 2.3], "#f2c230")]
for z in (-1.9, -1.0):
    for x in (-1.45, 1.45):
        BUSIN += [box([x, 0.25, z], [0.55, 0.5, 0.5], "#2b6cb0"), box([x, 0.75, z - 0.22], [0.55, 0.6, 0.08], "#24589a")]
RIDERS = [dict(FRIEND, at=[0.3, 0, 0.7], yaw=-0.15, pose="proud"),
          {"id": "p1", "model": BIZ, "tall": 1.75, "at": [-0.45, 0, -0.1], "yaw": 0.25, "pose": "relax"},
          {"id": "p2", "model": STK, "tall": 1.55, "at": [0.55, 0, -0.9], "yaw": -0.2, "pose": "relax"},
          {"id": "p3", "model": BIZ, "tall": 1.7, "at": [-0.3, 0, -1.7], "yaw": 0.1, "pose": "relax"},
          H(DRIVER)]
RIDER_NOTES = note(0.3, 1.02, 1.0, 0.3)
ALL_NOTES = RIDER_NOTES + note(-0.45, 1.12, 0.2, 0.3) + note(0.55, 1.0, -0.6, 0.3) + note(-0.3, 1.1, -1.4, 0.3)

# ---------------------------------------------------------------- the central bank: a press, a table with one loaf, a counter
PRESS = [box([-0.9, 0.55, -1.2], [1.7, 1.1, 1.0], "#59616d"), box([-0.9, 1.55, -1.5], [1.7, 0.9, 0.4], "#49515c"),
         cyl([-0.9, 1.28, -1.05], [0.15, 1.5], "#22262c", rot=[0, 0, 90]), cyl([-0.9, 1.58, -1.12], [0.15, 1.5], "#2c3139", rot=[0, 0, 90]),
         box([-0.9, 1.1, -0.55], [1.3, 0.04, 0.5], "#7d8794"),
         box([-1.55, 1.75, -1.28], [0.12, 0.12, 0.04], "#49e07c", glow=1), box([-1.35, 1.75, -1.28], [0.12, 0.12, 0.04], "#ffb23e", glow=1),
         cyl([1.7, 1.3, -2.0], [0.03, 2.6], "#2a2f3a"), {"shape": "cone", "at": [1.7, 2.55, -2.0], "size": [0.28, 0.3], "color": "#ffd9a0", "glow": 1}]
OUT1 = note(-0.9, 1.33, -0.52, 0.5) + stack(-0.2, -0.3, 0.3) + stack(0.2, -0.5, 0.18)
OUT2 = OUT1 + stack(0.55, -0.2, 0.5) + stack(0.95, -0.55, 0.8) + stack(0.1, 0.1, 0.4) + stack(1.3, -0.1, 0.35)
BIGNOTE = note(-0.6, 1.75, -0.45, 1.5)
TX = 5.0  # the table with the loaf
TABLE = [box([TX, 0.72, 0], [1.5, 0.06, 0.8], "#7a5230")] + [cyl([TX + dx, 0.35, dz], [0.04, 0.7], "#5a3c22") for dx in (-0.65, 0.65) for dz in (-0.3, 0.3)]
LOAF = [box([TX, 0.79, 0.12], [0.36, 0.08, 0.2], "#c98636"), cyl([TX, 0.83, 0.12], [0.1, 0.36], "#dba24f", rot=[0, 0, 90]),
        {"shape": "ball", "at": [TX - 0.18, 0.83, 0.12], "size": [0.1], "color": "#dba24f"}, {"shape": "ball", "at": [TX + 0.18, 0.83, 0.12], "size": [0.1], "color": "#dba24f"},
        box([TX - 0.1, 0.925, 0.12], [0.02, 0.03, 0.13], "#fff0c9", rot=[0, 25, 0]), box([TX, 0.927, 0.12], [0.02, 0.03, 0.13], "#fff0c9", rot=[0, 25, 0]),
        box([TX + 0.1, 0.925, 0.12], [0.02, 0.03, 0.13], "#fff0c9", rot=[0, 25, 0])]
PILES1 = stack(TX - 0.5, -0.1, 0.25, 0.75) + stack(TX + 0.5, -0.1, 0.35, 0.75) + stack(TX - 0.2, -0.25, 0.5, 0.75) + stack(TX + 0.2, -0.25, 0.42, 0.75)
PILES2 = (stack(TX - 0.5, -0.1, 0.6, 0.75) + stack(TX + 0.5, -0.1, 0.8, 0.75) + stack(TX - 0.2, -0.25, 1.1, 0.75) + stack(TX + 0.2, -0.25, 0.95, 0.75)
          + stack(TX - 0.6, -0.32, 1.3, 0.75) + stack(TX + 0.6, -0.32, 1.2, 0.75) + stack(TX - 1.1, 0.0, 1.4, 0.0, 0.34) + stack(TX + 1.1, 0.0, 1.7, 0.0, 0.34))
LAMP2 = [cyl([TX + 1.9, 1.3, -1.6], [0.03, 2.6], "#2a2f3a"), {"shape": "cone", "at": [TX + 1.9, 2.55, -1.6], "size": [0.28, 0.3], "color": "#ffd9a0", "glow": 1}]
BANK = PRESS
BANKER = dict(DRIVER, at=[0.75, 0, -0.75], yaw=-0.6, pose="think")
CX = 0.0
COUNTER = [box([CX, 0.52, 0.45], [2.6, 1.04, 0.5], "#6b4a2e"), box([CX, 1.06, 0.45], [2.7, 0.05, 0.6], "#3d2a1a"),
           box([CX, 2.45, -2.5], [1.5, 0.3, 0.06], "#d9b24a"), box([-1.6, 1.4, -2.5], [0.7, 2.8, 0.1], "#e8e2d2"), box([1.6, 1.4, -2.5], [0.7, 2.8, 0.1], "#e8e2d2"),
           box([-0.95, 1.5, 0.45], [0.05, 0.85, 0.5], "#3d2a1a"), box([0.95, 1.5, 0.45], [0.05, 0.85, 0.5], "#3d2a1a")]
CNOTE = flat_note(CX - 0.14, 1.09, 0.5, 0.3)
COINS = [cyl([CX + 0.09 + i * 0.062, 1.092, 0.5 + (i % 2) * 0.05], [0.026, 0.01], "#d7dbe0") for i in range(4)]
TELLER = dict(DRIVER, at=[CX, 0, -0.25], yaw=0.0, pose="relax")

HERO = note(HX, 1.4, 0, 0.56)
TWO = note(HX - 0.03, 1.64, 0, 0.5) + note(HX + 0.03, 1.12, 0.02, 0.44, NOTE_GREEN)

ST = STREET + POV
scenes = [
    # 1 hook: the stop, the bus, your note held up; the number in the first second
    sc(W(0), [W(0), W(4)], ST, ["label:0+stonks:think", "suit:wave"], cam(*WIDE, push=0.5, dur=110), "teal", "light", [DRIVER, FRIEND],
       tags=[tag("Z$100 TRILLION", 70, tone="warm")]),
    # 2 and it barely covers the bus fare: the driver at the door, unimpressed
    sc(W(9), [W(9), W(14)], STREET, ["suit:think", "suit:shrug"], cam([-0.1, 1.5, 1.9], [-0.6, 1.38, -1.3], 30, push=0.2, dur=70), "teal", "light",
       [DRIVER, H(FRIEND)], sfx=[{"name": "trombone", "beat": 1, "offset": 0.25, "gain": 0.3}]),
    # 3 Zimbabwe, January 2009: the whole street, low
    sc(W(16), [W(16), W(18)], STREET, ["cam", "stonks:scroll"], cam([3.4, 0.9, 5.6], [0.5, 1.4, -1.6], 44, push=0.4, dur=80), "teal", "light", [DRIVER, FRIEND]),
    # 4 one banknote, fourteen zeros: the note against the sky, the zeros under it
    sc(W(19), [W(19), W(21)], STREET + HERO, ["cam", "label:0"], cam([HX, 1.4, 2.3], [HX, 1.36, 0], 28, push=0.2, dur=60), "teal", "light",
       [H(DRIVER), H(FRIEND)], tags=[tag("100,000,000,000,000", 48, y=1440, raw=True)]),
    # 5 [stonks] One, two...
    sc(W(23), [W(23), W(24)], STREET + note(0.3, 1.2, 0.8, 0.28), ["stonks:point+stonks:talk:0.8", "stonks:point"],
       cam([0.5, 1.42, 3.7], [0.56, 1.22, 0.2], 28, push=0.12, dur=40), "teal", "light", [H(DRIVER), FRIEND]),
    # 6 you are the richest person on this bus: inside, Stonks with his note, proud
    sc(W(25), [W(25), W(28)], BUSIN + RIDER_NOTES, ["stonks:proud", "cam"], cam([0.45, 1.4, 3.7], [0.3, 1.18, 0.7], 30, push=0.2, dur=60), "teal", "light",
       RIDERS, backdrop="wall"),
    # 7 so is everyone else: wide, every passenger holds the same note
    sc(W(33), [W(33), W(36, at="end", plus=0.1)], BUSIN + ALL_NOTES, ["p1:proud+p2:proud+p3:proud", "stonks:look:25"],
       cam([0.1, 1.85, 4.9], [0.05, 1.1, -0.6], 40, push=0.3, dur=50), "teal", "light", RIDERS, backdrop="wall",
       sfx=[{"name": "rimshot", "beat": 1, "gain": 0.35}]),
    # 8 what your fortune buys: the market stall
    sc(W(37), [W(37), W(39)], STREET, ["suit:wave", "stonks:point"], cam([SX + 0.3, 1.5, 6.6], [SX + 0.15, 1.15, -0.5], 34, push=0.4, dur=70), "teal", "light",
       [KEEPER, SHOPPER]),
    # 9 day one: about thirty American dollars' worth
    sc(W(41), [W(41), W(44), W(47)], STREET, ["cam", "label:0", "suit:proud"], cam([SX - 0.9, 1.75, 2.6], [SX + 0.05, 1.0, -0.6], 34, push=0.25, dur=90), "teal", "light",
       [KEEPER, SHOPPER], tags=[tag("≈ US$30", 100, y=1360, tone="warm")], sfx=[{"name": "cash", "beat": 1, "offset": 0.1, "gain": 0.3}], long=True),
    # 10 soon: one bus fare
    sc(W(48), [W(48), W(49)], STREET + note(-0.05, 1.18, 0.7, 0.32), ["suit:relax", "label:0+suit:point"], cam([0.3, 1.5, 2.5], [-0.35, 1.3, -1.3], 34, push=0.2, dur=50),
       "teal", "light", [DRIVER, H(FRIEND)], tags=[tag("1 BUS FARE", 84)], sfx=[{"name": "whoosh", "gain": 0.3}]),
    # 11 [suit] Anything smaller?
    sc(W(52), [W(52)], STREET, ["suit:beg+suit:talk:1.3"], cam([-0.45, 1.56, 0.9], [-0.6, 1.5, -1.3], 30, push=0.12, dur=40), "teal", "light", [DRIVER, H(FRIEND)]),
    # 12 the next note down is fifty trillion (+pause)
    sc(W(54), [W(54), W(59), W(60, at="end", plus=0.25)], STREET + TWO, ["cam", "label:0", "cam"], cam([HX, 1.4, 2.5], [HX, 1.36, 0], 28, push=0.2, dur=70), "teal", "light",
       [H(DRIVER), H(FRIEND)], tags=[tag("50 TRILLION", 80, y=1110)], sfx=[{"name": "rimshot", "beat": 2, "gain": 0.35}]),
    # 13 how does that happen? the central bank, at night, the press
    sc(W(61), [W(61), W(64)], BANK + OUT1, ["suit:think", "suit:look:30"], cam([1.6, 1.7, 4.6], [-0.1, 1.1, -0.6], 38, push=0.35, dur=60), "night", "dark",
       [BANKER, H(FRIEND)], backdrop="wall", transition="whip", sfx=[{"name": "whoosh", "gain": 0.3}]),
    # 14 the central bank kept printing money
    sc(W(65), [W(65), W(69)], BANK + OUT2, ["suit:point", "suit:proud"], cam([1.5, 1.7, 4.3], [0.1, 1.0, -0.4], 36, push=0.25, dur=80), "night", "dark",
       [BANKER, H(FRIEND)], backdrop="wall", sfx=[{"name": "cash", "beat": 1, "offset": 0.0, "gain": 0.3}]),
    # 15 more notes, same bread
    sc(W(71), [W(71), W(73)], TABLE + LOAF + PILES1 + LAMP2, ["cam", "cam"], cam([TX + 0.5, 1.5, 2.4], [TX, 0.95, 0], 32, push=0.25, dur=50), "night", "dark",
       [H(DRIVER), H(FRIEND)], backdrop="wall"),
    # 16 prices rose, so it printed bigger notes
    sc(W(75), [W(75), W(79)], BANK + OUT2 + BIGNOTE, ["suit:think", "suit:cheer"], cam([0.6, 1.6, 4.2], [-0.2, 1.35, -0.5], 38, push=0.3, dur=80), "night", "dark",
       [dict(BANKER, at=[1.05, 0, -0.75]), H(FRIEND)], backdrop="wall", sfx=[{"name": "boom", "beat": 1, "offset": 0.0, "gain": 0.25}]),
    # 17 two months earlier, at the worst point, prices doubled about every day: the piles double, day turns to night
    sc(W(82), [W(82), W(89), W(93)], TABLE + LOAF + PILES2 + LAMP2, ["cam", "mood:blue+label:0", "mood:night"],
       cam([TX - 0.4, 1.7, 3.6], [TX, 1.15, -0.1], 36, push=0.35, dur=110), "night", "dark", [H(DRIVER), H(FRIEND)], backdrop="wall",
       tags=[tag("×2 EVERY DAY", 76, y=540, tone="warm")], long=True, sfx=[{"name": "tick", "beat": 1, "gain": 0.25, "dur": 1.6}]),
    # 18 one economist's estimate: low on the loaf, the piles above it
    sc(W(94), [W(94), W(96)], TABLE + LOAF + PILES2 + LAMP2, ["cam", "cam"], cam([TX + 0.25, 0.95, 1.5], [TX, 1.0, 0], 34, push=0.15, dur=50), "night", "dark",
       [H(DRIVER), H(FRIEND)], backdrop="wall"),
    # 19 [stonks] Where was I?
    sc(W(97), [W(97), W(99)], STREET + note(0.3, 1.2, 0.8, 0.28), ["stonks:shrug+stonks:talk:0.7", "stonks:think"],
       cam([0.8, 1.4, 3.5], [0.58, 1.22, 0.2], 28, push=0.1, dur=40), "teal", "light", [H(DRIVER), FRIEND]),
    # 20 April 2009. Zimbabwe stops using its own dollar: the stall again
    sc(W(100), [W(100), W(102), W(106)], STREET, ["cam", "stonks:point", "suit:think"], cam([SX + 1.2, 1.45, 5.6], [SX + 0.3, 1.15, -0.5], 34, push=0.35, dur=100), "teal", "light",
       [KEEPER, SHOPPER], long=True),
    # 21 in the shops, your fortune buys: nothing
    sc(W(108), [W(108), W(113), W(114)], STREET + note(SX + 0.62, 1.22, 0.45, 0.28), ["stonks:beg", "suit:shrug", "stamp"],
       cam([SX + 0.3, 1.5, 4.3], [SX + 0.45, 1.2, -0.5], 32, push=0.25, dur=80), "teal", "light", [KEEPER, SHOPPER],
       stamp={"text": "NOTHING", "x": 540, "y": 1330, "size": 150, "tone": "alert", "rot": -6}),
    # 22 six years on, the central bank will swap your note: the counter
    sc(W(115), [W(115), W(118), W(122)], COUNTER + CNOTE, ["suit:wave", "cam", "suit:point"], cam([0.35, 1.65, 4.6], [0, 1.3, 0], 34, push=0.35, dur=100), "blue", "light",
       [TELLER, H(FRIEND)], backdrop="wall", long=True, transition="whip", sfx=[{"name": "whoosh", "gain": 0.3}]),
    # 23 for forty American cents (+pause): four coins on the counter
    sc(W(125), [W(125), W(126), W(128, at="end", plus=0.3)], COUNTER + CNOTE + COINS, ["cam", "label:0", "cam"],
       cam([0.1, 1.95, 2.1], [0.07, 1.08, 0.5], 30, push=0.15, dur=70), "blue", "light", [H(TELLER), H(FRIEND)], backdrop="wall",
       tags=[tag("40 CENTS", 100, tone="alert")], sfx=[{"name": "cash", "beat": 1, "gain": 0.3}, {"name": "crickets", "beat": 2, "gain": 0.3, "dur": 0.7}], long=True),
]
# 24 the receipt: Reuters, 12 June 2015 (as carried by VOA)
scenes.append({"anchor": W(129), "component": "Shot", "theme": "light", "transition": "zoom", "long": True,
               "beats": [W(129), W(132), W(137), W(140)],
               "props": {"src": "voa.png", "chrome": "browser", "width": 940,
                         "url": "voanews.com/a/reu-zimbabwe-currency-value-quadrillions/2820282.html",
                         "source": "Reuters via VOA · 12 June 2015",
                         "cam": [{"x": 0.5, "y": 0.3, "zoom": 1.0}, {"x": 0.5, "y": 0.5, "zoom": 1.1},
                                 {"x": 0.5, "y": 0.86, "zoom": 1.6}, {"x": 0.5, "y": 0.88, "zoom": 1.7}],
                         "marks": [{"beat": 2, "kind": "underline", "x": 925, "y": 1882, "w": 285, "h": 40}]}})
DUSK = STREET
# 25 [stonks] Fourteen! (he finally got to the end)
scenes.append(sc(W(141), [W(141), W(141, at="end", plus=0.35)], DUSK + note(0.3, 1.2, 0.8, 0.28), ["stonks:cheer+stonks:talk:0.6", "stonks:proud"],
                 cam([0.3, 1.35, 4.0], [0.55, 1.2, 0.2], 30, push=0.12, dur=40), "pink", "light", [H(DRIVER), FRIEND],
                 sfx=[{"name": "ding", "beat": 0, "offset": 0.1, "gain": 0.35}]))
# 26 don't count the zeros. count what they buy: the stop at dusk, the bus, your note; held
scenes.append(sc(W(142), [W(142), W(146)], DUSK + POV, ["suit:relax", "stonks:look:20"], cam([0.25, 1.6, 6.7], [0.15, 1.25, -1.0], 36, push=-0.3, dur=160), "pink", "light",
                 [DRIVER, FRIEND], long=True))

sb = {"slug": "the-trillionaire", "format": "skit", "genre": "period", "bit": "the-list", "topic_source": "plan",
      "theme": "light", "tail": 1.7,
      "emphasis": ["hundred trillion dollars", "bus fare.", "January 2009.", "fourteen zeros.", "One, two...", "richest person",
                   "everyone else.", "thirty American dollars'", "Anything smaller?", "fifty trillion.", "printing money.",
                   "same bread.", "bigger notes.", "doubled", "every day.", "Where was I?", "nothing.", "forty American cents.",
                   "thirty-five dollars", "Fourteen!", "what they buy."],
      "scenes": scenes}
json.dump(sb, open(EP + "/storyboard.json", "w"), indent=1)
print(len(scenes), "scenes")
