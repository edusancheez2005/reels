import json

EP = "episodes/2026-11-26-the-typo"
SUIT = {"id": "suit", "model": "Bizdude.vrm", "at": [0, 0, 0], "tall": 1.75, "pose": "type"}
STONKS = {"id": "stonks", "model": "StonksReporter.vrm", "at": [0.35, 0, 0.1], "yaw": -0.55, "tall": 1.6, "pose": "relax"}
NOSTONKS = dict(STONKS, hidden=True)
NOSUIT = dict(SUIT, hidden=True)


def A(base, **kw):
    d = dict(base); d.update(kw); return d


def W(n, **kw):
    d = {"word": n}; d.update(kw); return d


def cam(pos, look, fov, push=0.25, dur=70):
    p2 = [pos[0], pos[1], pos[2] - push]
    return [{"pos": pos, "look": look, "fov": fov, "beat": -1}, {"pos": p2, "look": look, "fov": fov, "beat": 0, "dur": dur}]


def tag(text, size=80, y=450, tone=None):
    t = {"text": text, "x": 540, "y": y, "size": size, "pill": True}
    if tone: t["tone"] = tone
    return t


# --- the control room (desk set): red beacons on the back wall for the disaster
BEACONS = []
for x in (-1.25, 1.25):
    BEACONS += [{"shape": "cyl", "at": [x, 1.85, -1.3], "size": [0.12, 0.1], "color": "#2b2f36"},
                {"shape": "ball", "at": [x, 1.98, -1.3], "size": [0.16], "color": "#ff2d3d", "glow": 1}]
CLOCK = []
_CLOCK_UNUSED = [{"shape": "cyl", "at": [0.0, 2.25, -1.42], "size": [0.2, 0.04], "color": "#f4f6f8", "rot": [90, 0, 0]},
         {"shape": "box", "at": [0.0, 2.3, -1.39], "size": [0.02, 0.12, 0.01], "color": "#11151b"},
         {"shape": "box", "at": [0.04, 2.25, -1.39], "size": [0.09, 0.02, 0.01], "color": "#11151b"}]

SCREENS = {
    "send": {"head": "SEND · USDT", "big": "$100,000", "tone": "white", "sub": "digital dollars"},
    "fee": {"head": "NETWORK FEE", "big": "$23.7M", "tone": "alert", "sub": "7,676.6 ETH"},
    "calc": {"head": "FEE CALCULATOR", "big": "0.0.0.0", "tone": "warm", "sub": "decimal: ???"},
    "raw": {"head": "CONFIRM FEE", "big": "7676619078…", "tone": "warm", "sub": "2927624085 38"},
    "sent": {"head": "SENT", "big": "SENT", "tone": "alert", "sub": "fee: $23.7M"},
    "x237": {"head": "FEE vs AMOUNT", "big": "237×", "tone": "alert", "sub": "$23.7M / $100,000"},
    "undo": {"head": "UNDO", "big": "NO", "tone": "alert", "sub": "blockchain"},
    "read": {"head": "NETWORK FEE", "big": "READ IT", "tone": "white", "sub": "before you send"},
}

# --- the mining farm: racks of machines with green LEDs, a table with a tip jar
FARM = []
for x in (-1.8, -0.9, 0.0, 0.9, 1.8):
    FARM.append({"shape": "box", "at": [x, 1.0, -1.7], "size": [0.72, 2.0, 0.9], "color": "#1b1f27"})
    for i in range(6):
        y = 0.4 + i * 0.28
        FARM.append({"shape": "box", "at": [x, y, -1.245], "size": [0.6, 0.05, 0.01], "color": "#2c323d"})
        for dx in (-0.22, 0.22):
            FARM.append({"shape": "ball", "at": [x + dx, y + 0.08, -1.24], "size": [0.025], "color": "#39ff88", "glow": 1})
TABLE = [{"shape": "box", "at": [-0.6, 0.4, 0.25], "size": [0.62, 0.8, 0.5], "color": "#6b4a35"},
         {"shape": "box", "at": [-0.6, 0.81, 0.25], "size": [0.68, 0.03, 0.56], "color": "#4a3324"}]
JAR = [{"shape": "cyl", "at": [-0.6, 0.94, 0.25], "size": [0.1, 0.24], "color": "#e6f6ff"},
       {"shape": "cyl", "at": [-0.6, 1.065, 0.25], "size": [0.105, 0.012], "color": "#9fc8dc"}]
FEW = [{"shape": "cyl", "at": [-0.6 + dx, 0.835, 0.43 + dz], "size": [0.035, 0.012], "color": "#ffc83d", "glow": 0.4}
       for dx, dz in ((-0.08, 0.0), (0.06, 0.01), (0.0, -0.02))]
TIPLABEL = [{"shape": "plane", "at": [-0.6, 0.94, 0.352], "size": [0.12, 0.05], "color": "#ffffff"}]
PILE = [{"shape": "cone", "at": [-0.6, 1.27, 0.25], "size": [0.26, 0.4], "color": "#ffc83d", "glow": 0.35},
        {"shape": "cone", "at": [-0.95, 0.12, 0.45], "size": [0.3, 0.24], "color": "#ffc83d", "glow": 0.35},
        {"shape": "cone", "at": [-0.25, 0.1, 0.6], "size": [0.22, 0.2], "color": "#ffc83d", "glow": 0.35},
        {"shape": "cone", "at": [-1.25, 0.14, 0.0], "size": [0.34, 0.28], "color": "#ffc83d", "glow": 0.35}]
SMALL = [{"shape": "cone", "at": [-0.6, 0.87, 0.45], "size": [0.08, 0.08], "color": "#ffc83d", "glow": 0.4}]

farm_few = FARM + TABLE + JAR + FEW + TIPLABEL
farm_full = FARM + TABLE + JAR + PILE + TIPLABEL
farm_empty = FARM + TABLE + JAR + TIPLABEL
farm_small = FARM + TABLE + JAR + SMALL + TIPLABEL


def desk(anchor, beats, actions, cam_, mood, theme, props=None, tags=None, sfx=None, stamp=None, screen="send",
         actors=None, shift=None, long=False):
    p = {"set": "desk", "mood": mood, "props": props or [], "cam": cam_, "actions": actions,
         "actors": actors or [SUIT, NOSTONKS], "screens": SCREENS, "screen": screen}
    if tags: p["tags"] = tags
    if stamp: p["stamp"] = stamp
    if shift: p["shift"] = shift
    s = {"anchor": anchor, "component": "Actor3D", "transition": "cut", "moving": True, "beats": beats, "theme": theme, "props": p}
    if sfx: s["sfx"] = sfx
    if long: s["long"] = True
    return s


def farm(anchor, beats, props, actions, cam_, mood, theme, actors=None, tags=None, sfx=None, backdrop="wall", long=False):
    p = {"set": "studio", "mood": mood, "backdrop": backdrop, "props": props, "cam": cam_, "actions": actions,
         "actors": actors or [NOSUIT, STONKS]}
    if tags: p["tags"] = tags
    s = {"anchor": anchor, "component": "Actor3D", "transition": "cut", "moving": True, "beats": beats, "theme": theme, "props": p}
    if sfx: s["sfx"] = sfx
    if long: s["long"] = True
    return s


FACE = [0.3, 1.52, 2.35], [0, 1.5, 0], 30
FP = [0, 1.4, 0.07], [0, 0.92, 0.82], 74
WIDE = [2.0, 1.55, 3.6], [0.2, 1.0, 0.25], 40

scenes = [
    # 1 hook: Monday morning, you at the desk, the send screen; the fee tag in the first second
    desk(W(0), [W(0), W(3)], ["label:0+suit:type", "suit:type"], cam(*FACE, push=0.2, dur=110), "teal", "light",
         props=CLOCK, tags=[tag("$23.7M FEE", 96, tone="alert")]),
    # 2 ... and pay a fee: first person, the screen flips to the fee
    desk(W(9), [W(9), W(13)], ["suit:click", "screen:fee"], cam(*FP, push=0.05, dur=80), "teal", "light",
         props=CLOCK, shift=60, sfx=[{"name": "ding", "beat": 1, "offset": 0.0, "gain": 0.3}]),
    # 3 Sirens. Red lights.
    desk(W(17), [W(17), W(18)], ["shake+mood:doom", "suit:panic"], cam(*WIDE, push=0.3, dur=60), "doom", "dark",
         props=BEACONS + CLOCK, screen="fee", sfx=[{"name": "dun", "beat": 0, "gain": 0.45}]),
    # 4 [suit] It's fine.
    desk(W(20), [W(20)], ["suit:talk:0.6+suit:shrug"], cam([0.5, 1.42, 2.5], [0, 1.28, 0], 28, push=0.1, dur=40),
         "doom", "dark", props=BEACONS + CLOCK, screen="fee"),
    # 5 Replay. Slower.
    desk(W(22), [W(22), W(23)], ["stamp", "suit:type"], cam([1.6, 1.6, 3.0], [0, 1.2, 0], 36, push=0.2, dur=50), "blue", "dark",
         props=CLOCK, screen="send", stamp={"text": "REPLAY", "x": 540, "y": 1450, "size": 150, "tone": "warm", "rot": -6},
         sfx=[{"name": "whoosh", "beat": 0, "offset": -0.15, "gain": 0.45}]),
    # 6 a fee is a tip for the miner: the mining farm, Stonks by the tip jar
    farm(W(24), [W(24), W(31)], farm_few, ["stonks:relax", "label:0+stonks:wave"], cam([1.4, 1.5, 6.2], [0.0, 1.0, -0.3], 34, 0.4, 90),
         "night", "dark", tags=[tag("MINER", 90)]),
    # 7 whose computer writes your transfer onto the blockchain: along the racks
    farm(W(32), [W(32)], farm_few, ["stonks:think"], cam([1.9, 1.3, 0.2], [-0.6, 1.0, -1.4], 40, -0.0, 80), "night", "dark"),
    # 8 usually, a few dollars: the tip jar, three coins
    farm(W(40), [W(40)], farm_few, ["stonks:lean"], cam([-0.35, 1.25, 1.2], [-0.6, 0.9, 0.25], 30, 0.15, 50), "night", "dark",
         sfx=[{"name": "cash", "beat": 0, "offset": 1.0, "gain": 0.25}]),
    # 9 your software got a decimal wrong: replay, the calculator screen
    desk(W(44), [W(44), W(48)], ["suit:type", "screen:calc+suit:think"], cam(*FACE, push=0.15, dur=60), "blue", "dark",
         props=CLOCK, screen="send"),
    # 10 your wallet showed the fee as a number no human could read
    desk(W(50), [W(50), W(57)], ["suit:type", "screen:raw"], cam(*FP, push=0.05, dur=90), "blue", "dark",
         props=CLOCK, screen="calc", shift=60),
    # 11 quarter speed
    desk(W(62), [W(62)], ["label:0+suit:lean"], cam([0.25, 1.5, 1.9], [0, 1.48, 0], 30, 0.1, 60), "blue", "dark",
         props=CLOCK, screen="raw", tags=[tag("0.25× SPEED", 72)]),
    # 12 the finger. a finger with its whole life ahead of it (+ pause): the hand, very slowly
    desk(W(64), [W(64), W(66), W(74, at="end", plus=0.3)], ["suit:type", "suit:type", "suit:type"],
         cam([0, 1.4, 0.12], [0, 0.88, 0.8], 70, push=-0.14, dur=140), "blue", "light", props=CLOCK, screen="raw", long=True, shift=60,
         sfx=[{"name": "tick", "beat": 2, "gain": 0.35, "dur": 1.0}]),
    # 13 the button.
    desk(W(75), [W(75)], ["shake+screen:sent+mood:doom"], cam(*FP, push=0.0, dur=20), "doom", "dark",
         props=BEACONS + CLOCK, screen="raw", shift=60, sfx=[{"name": "slam", "beat": 0, "gain": 0.5}]),
    # 14 the fee: 237 times what you sent
    desk(W(77), [W(77), W(79)], ["suit:panic", "screen:x237"], cam(*FACE, push=0.2, dur=80), "doom", "dark",
         props=BEACONS + CLOCK, screen="sent"),
    # 15 a blockchain has no undo
    desk(W(87), [W(87), W(91)], ["screen:undo", "suit:facepalm"], cam([0.5, 1.42, 2.5], [0, 1.28, 0], 28, 0.1, 50), "doom", "dark",
         props=BEACONS + CLOCK, screen="x237", sfx=[{"name": "trombone", "beat": 1, "offset": 0.45, "gain": 0.35}]),
    # 16 the miner checks the tip jar: it's overflowing
    farm(W(92), [W(92)], farm_full, ["stonks:lean"], cam([0.3, 1.5, 3.8], [-0.25, 1.0, 0.15], 36, 0.25, 60), "night", "dark",
         sfx=[{"name": "cash", "beat": 0, "offset": 1.1, "gain": 0.35}]),
    # 17 [stonks] Huh. (+ pause)
    farm(W(98), [W(98), W(98, at="end", plus=0.25)], farm_full, ["stonks:talk:0.4+stonks:think", "stonks:think"],
         cam([-0.1, 1.45, 1.9], [0.3, 1.38, 0.05], 30, 0.1, 50), "night", "dark",
         sfx=[{"name": "crickets", "beat": 1, "gain": 0.3, "dur": 0.9}]),
    # 18 the rarest thing in crypto
    farm(W(99), [W(99)], farm_full, ["stonks:phone"], cam([1.6, 1.4, 4.4], [-0.1, 1.0, 0.0], 32, 0.3, 60), "teal", "light",
         sfx=[{"name": "ding", "beat": 0, "gain": 0.3}]),
    # 19 the miner gives it back. that night.
    farm(W(104), [W(104), W(108, at="end")], farm_empty, ["stonks:away", "stonks:proud"],
         cam([0.3, 1.2, 6.6], [-0.05, 0.95, 0], 30, 0.2, 70), "night", "dark",
         actors=[NOSUIT, A(STONKS, at=[0.6, 0, 0.1], yaw=0.0)],
         sfx=[{"name": "whoosh", "beat": 1, "offset": 0.1, "gain": 0.35}]),
    # 20 keeps a tip. for the tip.
    farm(W(111), [W(111), W(116, at="end", plus=0.1)], farm_small, ["stonks:proud", "stonks:relax"],
         cam([0.2, 1.35, 3.2], [0.0, 1.05, 0.15], 40, 0.15, 60), "night", "dark",
         sfx=[{"name": "rimshot", "beat": 1, "gain": 0.4}]),
]

# 21 the receipt: the real transaction on the explorer
scenes.append({"anchor": W(117), "component": "Shot", "theme": "light", "transition": "zoom", "long": True,
               "beats": [W(117), W(120), W(122), W(124), W(126)],
               "props": {"src": "tx_receipt.png", "chrome": "browser", "width": 940, "maxHeight": 1250,
                         "url": "eth.blockscout.com/tx/0x2c9931793876db33b1a9aad123ad4921dfb9cd5e59dbb78ce78f277759587115",
                         "source": "Blockscout · Ethereum block 13307440",
                         "cam": [{"x": 0.5, "y": 0.3, "zoom": 1.25}, {"x": 0.42, "y": 0.55, "zoom": 2.2},
                                 {"x": 0.6, "y": 0.58, "zoom": 1.8},
                                 {"x": 0.48, "y": 0.28, "zoom": 2.2}, {"x": 0.43, "y": 0.81, "zoom": 2.0}],
                         "marks": [{"beat": 1, "kind": "box", "x": 495, "y": 635, "w": 520, "h": 58},
                                   {"beat": 3, "kind": "underline", "x": 690, "y": 340, "w": 545, "h": 40},
                                   {"beat": 4, "kind": "box", "x": 495, "y": 955, "w": 515, "h": 60}]}})
# 22 [stonks] Anytime.
scenes.append(farm(W(127), [W(127)], farm_small, ["stonks:talk:0.6+stonks:wave"],
                   cam([0.15, 1.45, 1.9], [0.35, 1.38, 0.05], 30, 0.1, 40), "night", "dark", backdrop="sky"))
# 23 the step, held: back at the desk, reading the fee line
scenes.append(desk(W(128), [W(128), W(131)], ["suit:lean", "screen:read"], cam(*FACE, push=0.15, dur=80),
                   "teal", "light", props=CLOCK, screen="send"))
scenes.append(desk(W(134), [W(134), W(137)], ["suit:think", "label:0"], cam([0.3, 1.45, 2.9], [0, 1.35, 0], 34, push=0.15, dur=90),
                   "teal", "light", props=CLOCK, screen="read", tags=[tag("READ THE FEE", 80)]))

sb = {"slug": "the-typo", "format": "skit", "genre": "disaster", "bit": "slow-motion", "topic_source": "plan",
      "theme": "light", "tail": 1.5,
      "emphasis": ["Monday morning.", "twenty-four million", "Sirens.", "It's fine.", "Replay.", "a tip", "the miner,",
                   "a few dollars.", "a decimal wrong.", "no human could read.", "Quarter speed.", "whole life ahead",
                   "The button.", "thirty-seven times", "no undo.", "tip jar.", "Huh.", "rarest thing", "gives it back.",
                   "For the tip.", "DeversiFi,", "Anytime.", "read the fee.", "not fine."],
      "scenes": scenes}
json.dump(sb, open(EP + "/storyboard.json", "w"), indent=1)
print(len(scenes), "scenes")
