import json

EP = "episodes/2026-11-28-ten-coins"
SUIT = {"id": "suit", "model": "Bizdude.vrm", "at": [0, 0, 0], "tall": 1.75, "pose": "type"}
STONKS = {"id": "stonks", "model": "StonksReporter.vrm", "at": [0.62, 0, 0.15], "yaw": -0.5, "tall": 1.6, "pose": "relax"}
NOSTONKS = dict(STONKS, hidden=True)
NOSUIT = dict(SUIT, hidden=True)


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


DESKTOP = 0.745
GOLD, FACE_C = "#f0b232", "#ffd166"


def stack(x, z, n=10, r=0.055, glow=0.35):
    """a neat stack of n gold coins lying flat on the desk"""
    out = []
    for i in range(n):
        out.append({"shape": "cyl", "at": [x, DESKTOP + 0.009 + i * 0.019, z], "size": [r, 0.016],
                    "color": GOLD if i % 2 == 0 else FACE_C, "glow": glow})
    return out


LAMP = [{"shape": "cyl", "at": [-0.66, 0.77, 0.5], "size": [0.07, 0.03], "color": "#2a2f3a"},
        {"shape": "cyl", "at": [-0.66, 0.95, 0.5], "size": [0.012, 0.36], "color": "#2a2f3a"},
        {"shape": "cone", "at": [-0.66, 1.14, 0.53], "size": [0.1, 0.12], "color": "#ffcf7a", "glow": 1}]
WINDOW_DAY = [{"shape": "plane", "at": [-1.1, 1.6, -1.45], "size": [0.9, 0.7], "color": "#bfe3ff", "glow": 0.6},
              {"shape": "box", "at": [-1.1, 1.6, -1.44], "size": [0.04, 0.72, 0.02], "color": "#f4efe4"},
              {"shape": "box", "at": [-1.1, 1.6, -1.44], "size": [0.92, 0.04, 0.02], "color": "#f4efe4"}]
WINDOW_NIGHT = [{"shape": "plane", "at": [-1.1, 1.6, -1.45], "size": [0.9, 0.7], "color": "#1b2a52", "glow": 0.4},
                {"shape": "box", "at": [-1.1, 1.6, -1.44], "size": [0.04, 0.72, 0.02], "color": "#d9d4c7"},
                {"shape": "box", "at": [-1.1, 1.6, -1.44], "size": [0.92, 0.04, 0.02], "color": "#d9d4c7"},
                {"shape": "ball", "at": [-0.85, 1.78, -1.46], "size": [0.06], "color": "#fff6d8", "glow": 1}]

# a beige 2009 tower PC on the right of the desk, front facing the camera, with a round fan grille
TX, TZ = 0.78, 0.55
def tower(hot=False, off=False):
    body = [{"shape": "box", "at": [TX, DESKTOP + 0.23, TZ], "size": [0.2, 0.46, 0.44], "color": "#d8d0bd"},
            {"shape": "box", "at": [TX, DESKTOP + 0.38, TZ + 0.222], "size": [0.16, 0.05, 0.005], "color": "#3a3a3a"},
            {"shape": "cyl", "at": [TX, DESKTOP + 0.17, TZ + 0.223], "size": [0.07, 0.006], "rot": [90, 0, 0],
             "color": "#ff6a1a" if hot else "#2b2b2b", "glow": 1 if hot else 0},
            {"shape": "ball", "at": [TX + 0.06, DESKTOP + 0.42, TZ + 0.222], "size": [0.012],
             "color": "#40ff7a" if not off else "#203020", "glow": 0 if off else 1}]
    if hot:
        body += [{"shape": "box", "at": [TX, DESKTOP + 0.465, TZ], "size": [0.21, 0.012, 0.45], "color": "#ff3b1a", "glow": 0.9},
                 {"shape": "cone", "at": [TX - 0.05, DESKTOP + 0.56, TZ], "size": [0.025, 0.12], "color": "#ff8a3a", "glow": 0.8},
                 {"shape": "cone", "at": [TX + 0.05, DESKTOP + 0.6, TZ - 0.08], "size": [0.02, 0.1], "color": "#ff8a3a", "glow": 0.8},
                 {"shape": "cone", "at": [TX, DESKTOP + 0.62, TZ + 0.1], "size": [0.02, 0.09], "color": "#ffb36a", "glow": 0.8}]
    return body

# the empty chair: the buddy who is not there
CHAIR = [{"shape": "box", "at": [-1.05, 0.47, 0.45], "size": [0.46, 0.07, 0.46], "color": "#3d4a63"},
         {"shape": "box", "at": [-1.05, 0.8, 0.24], "size": [0.46, 0.56, 0.06], "color": "#3d4a63"},
         {"shape": "cyl", "at": [-1.05, 0.22, 0.45], "size": [0.03, 0.44], "color": "#22262e"},
         {"shape": "cyl", "at": [-1.05, 0.02, 0.45], "size": [0.24, 0.03], "color": "#22262e"}]

# a mailing list, literally: a row of mailboxes
MAILBOXES = []
for i, (x, z) in enumerate([(-2.1, -1.3), (-1.25, -1.7), (-0.4, -1.9), (0.45, -1.9), (1.3, -1.7), (2.15, -1.3)]):
    MAILBOXES += [{"shape": "cyl", "at": [x, 0.5, z], "size": [0.035, 1.0], "color": "#3b3f48"},
                  {"shape": "box", "at": [x, 1.12, z], "size": [0.32, 0.26, 0.46], "color": ["#2f6fb0", "#c9473c", "#2f6fb0", "#3b8f5a", "#c9473c", "#2f6fb0"][i]},
                  {"shape": "box", "at": [x + 0.18, 1.22, z + 0.08], "size": [0.02, 0.18, 0.06], "color": "#ffd23f"}]
# envelopes on the ground in front of them
ENVELOPES = [{"shape": "box", "at": [x, 0.01, z], "size": [0.24, 0.01, 0.16], "color": "#f4efe4", "rot": [0, r, 0]}
             for x, z, r in [(-0.9, -0.4, 20), (1.1, -0.2, -35), (-1.5, 0.4, 60), (0.9, 0.6, 10), (-0.3, -0.9, -15)]]

SCREENS = {
    "inbox": {"head": "INBOX", "big": "0", "tone": "white", "sub": "waiting…"},
    "name": {"head": "FROM", "big": "SATOSHI", "tone": "warm", "sub": "Nakamoto"},
    "download": {"head": "DOWNLOADING", "big": "v0.1", "tone": "accent", "sub": "bitcoin"},
    "received": {"head": "RECEIVED", "big": "10 BTC", "tone": "good", "sub": "12 Jan 2009 · block 170"},
    "bug": {"head": "BUG REPORT", "big": "BUG", "tone": "alert", "sub": "to: Satoshi"},
    "fixed": {"head": "REPLY", "big": "FIXED", "tone": "good", "sub": "from: Satoshi"},
    "who": {"head": "REAL NAME", "big": "?", "tone": "white", "sub": "unknown"},
    "mining": {"head": "MINING", "big": "ON", "tone": "warm", "sub": "making new coins"},
    "off": {"head": "MINING", "big": "OFF", "tone": "white", "sub": ""},
    "test": {"head": "NEW ADDRESS", "big": "TEST", "tone": "accent", "sub": ""},
}


def desk(anchor, beats, actions, cam_, mood, theme, props=None, tags=None, sfx=None, screen="inbox",
         actors=None, shift=None, long=False, stamp=None):
    p = {"set": "desk", "mood": mood, "props": props or [], "cam": cam_, "actions": actions,
         "actors": actors or [SUIT, NOSTONKS], "screens": SCREENS, "screen": screen}
    if tags: p["tags"] = tags
    if stamp: p["stamp"] = stamp
    if shift: p["shift"] = shift
    s = {"anchor": anchor, "component": "Actor3D", "transition": "cut", "moving": True, "beats": beats, "theme": theme, "props": p}
    if sfx: s["sfx"] = sfx
    if long: s["long"] = True
    return s


def out(anchor, beats, props, actions, cam_, mood, theme, actors, tags=None, sfx=None, long=False):
    p = {"set": "studio", "mood": mood, "backdrop": "sky", "props": props, "cam": cam_, "actions": actions, "actors": actors}
    if tags: p["tags"] = tags
    s = {"anchor": anchor, "component": "Actor3D", "transition": "cut", "moving": True, "beats": beats, "theme": theme, "props": p}
    if sfx: s["sfx"] = sfx
    if long: s["long"] = True
    return s


FACE = [0.3, 1.52, 2.35], [0, 1.5, 0], 30
FP = [0, 1.4, 0.07], [0, 0.92, 0.82], 74
WIDE = [2.0, 1.55, 3.6], [0.2, 1.0, 0.25], 40

DAY = LAMP + WINDOW_DAY + tower()
NIGHT = LAMP + WINDOW_NIGHT

STONKS_LIST = A(STONKS, at=[0.0, 0, 0.6], yaw=0.0)

scenes = [
    # 1 hook: a sunny home office in 2009; ten coins stacked by the keyboard, waiting; the number in the first second
    desk(W(0), [W(0), W(7)], ["label:0+suit:type", "suit:look:-20"],
         cam([0.9, 1.35, 2.5], [0.1, 1.05, 0.5], 36, push=0.25, dur=110), "day", "light",
         props=DAY + stack(0.42, 0.95), tags=[tag("TEN COINS", 104, y=1280, tone="warm")], screen="inbox"),
    # 1b Ten coins. (close on the stack)
    desk(W(11), [W(11), W(12)], ["cam", "suit:look:-20"],
         cam([0.62, 1.05, 1.55], [0.42, 0.85, 0.95], 30, push=0.1, dur=50), "day", "light",
         props=DAY + stack(0.42, 0.95), screen="inbox"),
    # 2 January 2009. You've never met him. Nobody has. (wide: the empty chair beside him)
    desk(W(13), [W(13), W(15)], ["label:0+suit:relax", "suit:look:-60"],
         cam([1.4, 1.5, 3.9], [-0.35, 0.95, 0.2], 40, push=0.3, dur=100), "day", "light",
         props=DAY + CHAIR + stack(0.42, 0.95), tags=[tag("JAN 2009", 84)], screen="inbox"),
    # 2b Nobody has. (the empty chair, alone in a pool of light)
    desk(W(19), [W(19), W(20)], ["suit:look:-60", "suit:shrug"],
         cam([-0.2, 1.3, 3.4], [-1.05, 0.7, 0.35], 34, push=0.15, dur=40), "day", "light",
         props=DAY + CHAIR + [{"shape": "ball", "at": [-1.05, 2.4, 0.45], "size": [0.05], "color": "#fff6d8", "glow": 1}], screen="inbox"),
    # 3 He calls himself Satoshi Nakamoto: his name on the screen, the face over the monitor
    desk(W(21), [W(21), W(24)], ["suit:think", "screen:name+suit:look:0"], cam(*FACE, push=0.12, dur=60), "day", "light",
         props=DAY, screen="inbox"),
    # 4 He's posted bitcoin to a mailing list of cryptographers: a mailing list, literally
    out(W(26), [W(26), W(31)], MAILBOXES + ENVELOPES, ["cam", "cam"],
        [{"pos": [0.0, 1.45, 3.0], "look": [0.0, 0.85, -1.6], "fov": 46, "beat": -1},
         {"pos": [0.0, 1.35, 2.4], "look": [0.0, 0.9, -1.6], "fov": 46, "beat": 1, "dur": 60}],
        "pink", "light", [NOSUIT, A(STONKS_LIST, hidden=True)]),
    # 5 The list replies. [stonks] Unsubscribe. (Stonks is the whole sceptical list)
    out(W(35), [W(35), W(38)], MAILBOXES + ENVELOPES, ["stonks:in+stonks:think", "stonks:talk:1.0+stonks:point"],
        cam([0.2, 1.3, 3.9], [0.0, 1.1, 0.2], 34, push=0.2, dur=60), "pink", "light", [NOSUIT, STONKS_LIST],
        sfx=[{"name": "buzzer", "beat": 1, "offset": 0.9, "gain": 0.3}]),
    # 6 You download his software: first person at the screen
    desk(W(39), [W(39)], ["suit:type+screen:download"], cam(*FP, push=0.04, dur=60), "day", "light",
         props=DAY, screen="name", shift=60),
    # 7 He sends you ten bitcoin. As a test. (the screen flips to RECEIVED)
    desk(W(43), [W(43), W(46), W(48)], ["suit:type", "screen:received", "suit:click"], cam(*FP, push=0.04, dur=80), "day", "light",
         props=DAY, screen="download", shift=60, sfx=[{"name": "ding", "beat": 1, "offset": 0.3, "gain": 0.35}]),
    # 8 [suit] Received. ... (a long silence)
    desk(W(51), [W(51), W(51, at="end", plus=0.35)], ["suit:talk:0.7+suit:relax", "suit:look:-5"],
         cam([0.25, 1.5, 2.1], [0, 1.48, 0], 30, push=0.08, dur=60), "day", "light", props=DAY + stack(0.42, 0.95),
         screen="received", sfx=[{"name": "crickets", "beat": 1, "gain": 0.3, "dur": 0.7}]),
    # 9 That's the hug. (he gives the monitor a little wave)
    desk(W(52), [W(52)], ["suit:wave"], cam([1.1, 1.45, 2.6], [0.0, 1.2, 0.3], 34, push=0.1, dur=40), "day", "light",
         props=DAY + stack(0.42, 0.95), screen="received"),
    # 10 You report bugs. He fixes them. (screen: BUG → FIXED)
    desk(W(55), [W(55), W(58)], ["suit:type+screen:bug", "screen:fixed"], cam(*FP, push=0.04, dur=60), "teal", "dark",
         props=LAMP + WINDOW_DAY + tower(), screen="received", shift=60),
    # 11 The closest partnership in bitcoin. (proud, alone, the empty chair)
    desk(W(61), [W(61)], ["suit:proud"], cam([1.6, 1.5, 3.4], [-0.3, 1.0, 0.2], 38, push=0.2, dur=60), "teal", "dark",
         props=LAMP + WINDOW_DAY + tower() + CHAIR, screen="fixed"),
    # 12 You never learn his real name.
    desk(W(66), [W(66), W(69)], ["screen:who+suit:look:0", "suit:think"], cam(*FACE, push=0.1, dur=50), "teal", "dark",
         props=LAMP + WINDOW_DAY + tower(), screen="fixed"),
    # 13 Your computer also mines, which makes new coins. (night, the tower lit, the screen MINING ON)
    desk(W(72), [W(72), W(77)], ["suit:relax+screen:mining", "suit:look:30"], cam([1.6, 1.45, 2.9], [0.3, 1.0, 0.3], 38, push=0.2, dur=80),
         "night", "dark", props=NIGHT + tower(), screen="fixed"),
    # 14 But it runs hot, and the fan's loud. (the tower glows orange; he winces)
    desk(W(80), [W(80), W(86)], ["suit:look:35", "suit:facepalm"], cam([1.9, 1.35, 2.4], [0.35, 1.05, 0.35], 38, push=0.12, dur=60),
         "doom", "dark", props=NIGHT + tower(hot=True), screen="mining"),
    # 15 You switch it off. (the tower dark, MINING OFF)
    desk(W(88), [W(88), W(91)], ["suit:click", "screen:off+suit:relax"], cam([0.9, 1.35, 2.5], [0.3, 1.05, 0.4], 36, push=0.1, dur=50),
         "night", "dark", props=NIGHT + tower(off=True), screen="mining"),
    # 16 [suit] Much better. (leans back, peace and quiet)
    desk(W(92), [W(92)], ["suit:talk:0.8+suit:lean"], cam([0.3, 1.5, 2.3], [0, 1.45, 0], 30, push=0.1, dur=50), "night", "dark",
         props=NIGHT + tower(off=True), screen="off"),
]

# 17 the receipt: Guinness World Records' "First Bitcoin transaction"
scenes.append({"anchor": W(94), "component": "Shot", "theme": "light", "transition": "zoom", "long": True,
               "beats": [W(94), W(96), W(97), W(100), W(102), W(104)],
               "props": {"src": "guinness.png", "chrome": "browser", "width": 940,
                         "url": "guinnessworldrecords.com/world-records/696243-first-bitcoin-transaction",
                         "source": "Guinness World Records",
                         "cam": [{"x": 0.5, "y": 0.45, "zoom": 1.0}, {"x": 0.45, "y": 0.35, "zoom": 1.08}, {"x": 0.3, "y": 0.15, "zoom": 1.25},
                                 {"x": 0.32, "y": 0.2, "zoom": 1.3}, {"x": 0.62, "y": 0.3, "zoom": 1.25}, {"x": 0.55, "y": 0.7, "zoom": 1.15}],
                         "marks": [{"beat": 2, "kind": "box", "x": 20, "y": 82, "w": 530, "h": 42},
                                   {"beat": 4, "kind": "box", "x": 662, "y": 232, "w": 290, "h": 42},
                                   {"beat": 5, "kind": "underline", "x": 400, "y": 722, "w": 360, "h": 22}]}})
# 18 Hal's own words: the fan, "I wish I had kept it up longer", "extraordinarily lucky to be there"
scenes.append({"anchor": W(105), "component": "Shot", "theme": "light", "transition": "whip", "long": True,
               "beats": [W(105), W(107), W(109), W(112), W(115), W(117), W(120)],
               "props": {"src": "finney_para_fan.png", "chrome": "browser", "width": 940,
                         "url": "nakamotoinstitute.org/bitcoin-and-me/",
                         "source": "Hal Finney, \"Bitcoin and Me\", 19 Mar 2013",
                         "cam": [{"x": 0.5, "y": 0.5, "zoom": 1.0}, {"x": 0.45, "y": 0.45, "zoom": 1.1}, {"x": 0.6, "y": 0.55, "zoom": 1.3},
                                 {"x": 0.4, "y": 0.65, "zoom": 1.3}, {"x": 0.5, "y": 0.62, "zoom": 1.2}, {"x": 0.62, "y": 0.66, "zoom": 1.35},
                                 {"x": 0.65, "y": 0.66, "zoom": 1.42}],
                         "marks": [{"beat": 1, "kind": "underline", "x": 300, "y": 172, "w": 500, "h": 22},
                                   {"beat": 2, "kind": "underline", "x": 1035, "y": 222, "w": 225, "h": 22},
                                   {"beat": 3, "kind": "underline", "x": 40, "y": 272, "w": 300, "h": 22},
                                   {"beat": 5, "kind": "circle", "x": 735, "y": 240, "w": 420, "h": 56}]}})
# 19 Even bitcoin's inventor sent a test. (daylight again, the ten coins on the desk)
scenes.append(desk(W(122), [W(122)], ["suit:relax"], cam([0.9, 1.35, 2.5], [0.1, 1.05, 0.5], 36, push=0.15, dur=60),
                   "day", "light", props=DAY + stack(0.42, 0.95), screen="received"))
# 20 the step, held: Sending somewhere new? Send a small amount first. (first person, TEST on the screen)
scenes.append(desk(W(128), [W(128), W(131)], ["suit:type", "screen:test"], cam(*FP, push=0.04, dur=120), "day", "light",
                   props=DAY, screen="received", shift=60, long=True))

sb = {"slug": "ten-coins", "format": "skit", "genre": "buddy-film", "bit": "never-meet", "topic_source": "plan",
      "theme": "light", "tail": 1.6,
      "emphasis": ["first bitcoin transfer.", "Ten coins.", "never met him.", "Nobody has.", "Satoshi Nakamoto.",
                   "mailing list", "Unsubscribe.", "ten bitcoin.", "As a test.", "Received.", "the hug.",
                   "report bugs.", "fixes them.", "real name.", "runs hot,", "fan's loud.", "switch it off.",
                   "Much better.", "Hal Finney,", "extraordinarily lucky", "small amount first."],
      "scenes": scenes}
json.dump(sb, open(EP + "/storyboard.json", "w"), indent=1)
print(len(scenes), "scenes")
