import json, copy
SUIT = {"id": "suit", "model": "Bizdude.vrm", "at": [0, 0, 0], "tall": 1.75, "pose": "type"}
BOSS_AT = [1.25, 0, 0.75]
def stonks(pose="relax", hidden=False, yaw=-0.7, at=None):
    d = {"id": "stonks", "model": "StonksReporter.vrm", "at": at or BOSS_AT, "yaw": yaw, "tall": 1.6, "pose": pose}
    if hidden: d["hidden"] = True
    return d
def suit(pose="type", **kw):
    d = dict(SUIT); d["pose"] = pose; d.update(kw); return d

# office set dressing (simple solids)
WALL = -2.55
def office(machine=True, chair=True):
    p = [
        # window with frame and a mullion
        {"shape": "box", "at": [-1.25, 1.65, WALL], "size": [1.3, 1.0, 0.04], "color": "#3a3f4b"},
        {"shape": "plane", "at": [-1.25, 1.65, WALL + 0.03], "size": [1.18, 0.88], "color": "#bfe6ff", "glow": 1},
        {"shape": "box", "at": [-1.25, 1.65, WALL + 0.05], "size": [0.04, 0.88, 0.02], "color": "#3a3f4b"},
        # wall chart: the reward staircase (50, 25, 12.5, 6.25, 3.125)
        {"shape": "box", "at": [1.15, 1.7, WALL], "size": [1.1, 0.85, 0.03], "color": "#fbfaf6"},
    ]
    hs = [0.6, 0.3, 0.15, 0.075, 0.0375]
    for i, h in enumerate(hs):
        p.append({"shape": "box", "at": [0.75 + i * 0.2, 1.36 + h / 2, WALL + 0.03], "size": [0.13, h, 0.02], "color": "#f7931a"})
    p += [
        # filing cabinet with drawer lines
        {"shape": "box", "at": [1.75, 0.6, -1.5], "size": [0.5, 1.2, 0.55], "color": "#8e98a8"},
        {"shape": "box", "at": [1.75, 0.9, -1.22], "size": [0.3, 0.03, 0.02], "color": "#3a3f4b"},
        {"shape": "box", "at": [1.75, 0.5, -1.22], "size": [0.3, 0.03, 0.02], "color": "#3a3f4b"},
        # side counter for the coffee machine
        {"shape": "box", "at": [-1.55, 0.45, -0.5], "size": [0.7, 0.9, 0.5], "color": "#c9955c"},
    ]
    if machine:
        p += [
            {"shape": "box", "at": [-1.55, 1.12, -0.55], "size": [0.32, 0.44, 0.3], "color": "#20242c"},
            {"shape": "box", "at": [-1.55, 1.0, -0.38], "size": [0.2, 0.04, 0.12], "color": "#6b7280"},
            {"shape": "cyl", "at": [-1.55, 0.95, -0.36], "size": [0.04, 0.09], "color": "#f4f1ea"},
            {"shape": "ball", "at": [-1.47, 1.26, -0.395], "size": [0.018], "color": "#ff3b30", "glow": 1},
        ]
    if chair:
        p += [
            {"shape": "cyl", "at": [0, 0.03, -0.5], "size": [0.28, 0.04], "color": "#20242c"},
            {"shape": "cyl", "at": [0, 0.27, -0.5], "size": [0.035, 0.45], "color": "#6b7280"},
            {"shape": "box", "at": [0, 0.52, -0.5], "size": [0.52, 0.08, 0.5], "color": "#d6453d"},
            {"shape": "box", "at": [0, 0.92, -0.76], "size": [0.5, 0.66, 0.07], "color": "#d6453d"},
        ]
    # door on the left wall-end
    p += [
        {"shape": "box", "at": [-2.45, 1.05, WALL + 0.02], "size": [0.95, 2.1, 0.05], "color": "#8a5a35"},
        {"shape": "ball", "at": [-2.1, 1.0, WALL + 0.07], "size": [0.04], "color": "#e3c27a"},
    ]
    return p

SCREENS = {
    "idle": {"head": "MINING", "big": "ON", "tone": "good", "sub": "sealing blocks"},
    "block": {"head": "NEW BLOCK", "big": "SEALED", "tone": "good", "sub": "a block of payments"},
    "p50": {"head": "PAY PER BLOCK · 2009", "big": "50", "tone": "good", "sub": "new bitcoin"},
    "p25": {"head": "PAY PER BLOCK · 2012", "big": "25", "tone": "warm", "sub": "new bitcoin"},
    "p12": {"head": "PAY PER BLOCK · 2016", "big": "12.5", "tone": "warm", "sub": "new bitcoin"},
    "p6": {"head": "PAY PER BLOCK · 2020", "big": "6.25", "tone": "alert", "sub": "new bitcoin"},
    "p3": {"head": "PAY PER BLOCK · 2024", "big": "3.125", "tone": "alert", "sub": "new bitcoin", "chart": "down"},
    "code": {"head": "BITCOIN'S CODE", "big": "÷ 2", "tone": "white", "sub": "every 210,000 blocks"},
    "next": {"head": "NEXT CUT", "big": "~2028", "tone": "white", "sub": "block 1,050,000"},
}
CAM = {
    "wide": {"pos": [2.0, 1.55, 3.6], "look": [0.2, 1.0, 0.25], "fov": 40},
    "office": {"pos": [0.9, 1.6, 5.4], "look": [0.0, 1.15, -0.6], "fov": 40},
    "face": {"pos": [0.3, 1.52, 2.35], "look": [0, 1.5, 0], "fov": 30},
    "fp": {"pos": [0, 1.4, 0.07], "look": [0, 0.92, 0.82], "fov": 74},
    "both": {"pos": [1.15, 1.4, 4.0], "look": [0.7, 1.25, 0.35], "fov": 40},
    "boss": {"pos": [1.75, 1.45, 3.2], "look": [1.2, 1.32, 0.7], "fov": 28},
    "jump": {"pos": [1.2, 1.25, 5.6], "look": [0.7, 1.0, 0.4], "fov": 34},
    "side": {"pos": [-0.5, 1.45, 2.7], "look": [-1.2, 0.95, -0.5], "fov": 40},
}
def cam(name, beat=-1, **over):
    c = dict(CAM[name]); c["beat"] = beat; c.update(over); return c

def A(anchor, beats, mood, actions, cams, actors, screen="idle", machine=True, chair=True, tags=None, stamp=None,
      shift=None, sfx=None, transition="cut", extra_props=None, theme="light", backdrop=None, setname="desk", props_override=None):
    p = {"set": setname, "mood": mood, "screens": SCREENS, "screen": screen, "cam": cams, "actions": actions, "actors": actors,
         "props": props_override if props_override is not None else office(machine, chair) + (extra_props or [])}
    if tags: p["tags"] = tags
    if stamp: p["stamp"] = stamp
    if shift: p["shift"] = shift
    if backdrop: p["backdrop"] = backdrop
    if mood in ("night", "doom"): theme = "dark"
    s = {"anchor": anchor, "component": "Actor3D", "theme": theme, "transition": transition, "moving": True, "props": p, "beats": beats}
    if sfx: s["sfx"] = sfx
    return s

S = []
# 1 hook: the office, you at your desk; the boss pops in clapping on "claps"
S.append(A("You have the only", ["You", "cuts"], "teal",
    ["label:0+suit:type", "suit:think"],
    [cam("office"), cam("office", 1, pos=[0.8, 1.58, 4.7], dur=60)],
    [suit("type"), stonks("clap", hidden=True)],
    tags=[{"text": "50% pay cut", "x": 540, "y": 520, "tone": "alert", "size": 84, "pill": True}]))
S.append(A("every four years, and everybody", ["every", "everybody", "claps."], "teal",
    ["suit:think", "stonks:in+stonks:clap", "suit:proud"],
    [cam("both"), cam("both", 2, pos=[1.1, 1.42, 3.7], dur=30)],
    [suit("type"), stonks("clap", hidden=True)], screen="idle"))
# 2 you mine: his face over the monitor, then first person at the screen
S.append(A("You mine bitcoin.", ["mine", "2009,"], "teal",
    ["suit:type", "suit:lean"],
    [cam("face"), cam("face", 1, pos=[0.25, 1.5, 2.1], dur=40)],
    [suit("type"), stonks(hidden=True)], screen="idle"))
S.append(A("every block of payments", ["every", "payments", "fifty"], "teal",
    ["suit:type+screen:idle", "screen:block+suit:click", "screen:p50"],
    [cam("fp"), cam("fp", 2, pos=[0, 1.39, 0.1], dur=40)],
    [suit("type"), stonks(hidden=True)], screen="idle", shift=60, transition="whip"))
# 3 the boss walks in
S.append(A("In 2012, the boss", ["2012,", "walks"], "teal",
    ["suit:type", "stonks:in+label:0"],
    [cam("wide", pos=[1.7, 1.5, 4.6], look=[0.65, 1.05, 0.3], fov=40), cam("wide", 1, pos=[1.75, 1.48, 4.2], look=[0.7, 1.05, 0.35], fov=40, dur=30)],
    [suit("type"), stonks("point", hidden=True)], screen="p50",
    tags=[{"text": "your boss", "x": 700, "y": 600, "size": 56, "pill": True}],
    sfx=[{"name": "slam", "beat": 1, "gain": 0.5}]))
# 4 Twenty-five!
S.append(A("Twenty-five!", ["Twenty-five!"], "teal",
    ["stonks:talk:0.8+stonks:point+stamp"],
    [cam("boss"), cam("boss", 0, pos=[1.7, 1.45, 3.0], dur=20)],
    [suit("type"), stonks("cheer")], screen="p25",
    stamp={"text": "-50%", "x": 540, "y": 1380, "size": 150, "tone": "alert", "rot": -6}))
# 5 you clap too
S.append(A("You clap too.", ["clap"], "teal",
    ["suit:clap+stonks:clap"],
    [cam("both")],
    [suit("proud"), stonks("cheer")], screen="p25"))
# 6 2016 screen
S.append(A("2016, twelve", ["2016,", "twelve"], "blue",
    ["suit:type", "screen:p12"],
    [cam("fp", fov=70), cam("fp", 1, pos=[0, 1.39, 0.12], fov=68, dur=40)],
    [suit("type"), stonks(hidden=True)], screen="p25", shift=60, transition="whip"))
# 7 sell the coffee machine: the counter, empty, mug left
S.append(A("You sell the coffee", ["sell", "machine."], "blue",
    ["suit:shrug", "suit:proud"],
    [cam("side"), cam("side", 1, pos=[-0.6, 1.4, 2.4], dur=30)],
    [suit("relax", yaw=-0.5), stonks(hidden=True)], screen="p12", machine=False,
    extra_props=[{"shape": "cyl", "at": [-1.55, 0.95, -0.45], "size": [0.045, 0.1], "color": "#f4f1ea"}]))
# 8 2020 screen
S.append(A("2020, six", ["2020,", "six"], "night",
    ["suit:type", "screen:p6"],
    [cam("fp", fov=72), cam("fp", 1, pos=[0, 1.39, 0.1], fov=70, dur=40)],
    [suit("type"), stonks(hidden=True)], screen="p12", machine=False, shift=60, transition="whip"))
# 9 sell your chair: full body, no chair
S.append(A("You sell your chair.", ["sell", "chair."], "night",
    ["suit:relax", "suit:shrug"],
    [cam("jump", pos=[0.4, 1.15, 4.6], look=[0.0, 0.85, -0.2], fov=32)],
    [suit("relax"), stonks(hidden=True)], screen="p6", machine=False, chair=False,
    sfx=[{"name": "trombone", "beat": 1, "offset": 0.45, "gain": 0.45}]))
# 10 2024 screen
S.append(A("2024, three", ["2024,", "three"], "doom",
    ["suit:type", "screen:p3"],
    [cam("fp", fov=74), cam("fp", 1, pos=[0, 1.39, 0.1], fov=71, dur=40)],
    [suit("type"), stonks(hidden=True)], screen="p6", machine=False, chair=False, shift=60, transition="whip"))
# 11 Standing desk.
S.append(A("Standing desk.", ["Standing"], "doom",
    ["suit:talk:1.0+suit:proud"],
    [cam("face", pos=[0.35, 1.5, 2.6], fov=34)],
    [suit("type"), stonks(hidden=True)], screen="p3", machine=False, chair=False))
# 12 Your boss has never been prouder + jump
S.append(A("Your boss has never", ["Your", "prouder."], "doom",
    ["stonks:in+stonks:proud", "stonks:jump"],
    [cam("jump"), cam("jump", 1, pos=[1.15, 1.22, 5.3], dur=60)],
    [suit("slump"), stonks("proud", hidden=True)], screen="p3", machine=False, chair=False))
S[-1]["long"] = True
# 13 One problem. There is no boss.
S.append(A("One problem.", ["One", "no", "boss."], "night",
    ["stonks:clap", "stonks:out", "stamp+suit:think"],
    [cam("jump"), cam("jump", 1, pos=[1.0, 1.3, 4.9], dur=30)],
    [suit("slump"), stonks("clap")], screen="p3", machine=False, chair=False,
    stamp={"text": "no boss", "x": 540, "y": 1400, "size": 120, "tone": "warm", "rot": -5},
    sfx=[{"name": "scratch", "beat": 0, "gain": 0.6}], transition="cut"))
# 14 the code
S.append(A("Bitcoin's code", ["code", "halves"], "teal",
    ["screen:code", "suit:click"],
    [cam("fp"), cam("fp", 1, pos=[0, 1.39, 0.12], dur=40)],
    [suit("type"), stonks(hidden=True)], screen="p3", machine=False, chair=False, shift=60, transition="whip"))
# the wall chart: the staircase of cuts
S.append(A("every four years or so", ["every", "until", "stop."], "teal",
    ["suit:point", "suit:think", "suit:shrug"],
    [cam("wide", pos=[0.2, 1.62, 1.2], look=[1.15, 1.62, -2.55], fov=42), cam("wide", 1, pos=[0.4, 1.62, 0.6], look=[1.3, 1.5, -2.55], fov=40, dur=60)],
    [suit("think"), stonks(hidden=True)], screen="code", machine=False, chair=False))
# 15 21 million: outside, under the stars, a stack of coins
coins = [{"shape": "cyl", "at": [0.75, 0.04 + i * 0.075, 0.2], "size": [0.22, 0.07], "color": "#f2a93b" if i % 2 else "#f7b955"} for i in range(9)]
coins += [{"shape": "cyl", "at": [-0.7, 0.04 + i * 0.075, -0.1], "size": [0.22, 0.07], "color": "#f2a93b" if i % 2 else "#f7b955"} for i in range(6)]
S.append(A("So only", ["only", "million"], "night",
    ["suit:look:-20", "label:0+suit:point"],
    [cam("wide", pos=[0.6, 1.25, 4.4], look=[0.1, 1.1, 0], fov=36), cam("wide", 1, pos=[0.5, 1.3, 4.0], look=[0.1, 1.15, 0], fov=36, dur=40)],
    [suit("think"), stonks(hidden=True)], setname="studio", backdrop="sky", props_override=coins,
    tags=[{"text": "21 million max", "x": 540, "y": 520, "tone": "warm", "size": 62, "pill": True}], transition="whip"))
# 16 callback: your not-boss is still clapping
S.append(A("Your not-boss", ["not-boss", "clapping.", "Again!"], "teal",
    ["stonks:in+stonks:jump", "suit:facepalm", "stonks:talk:0.6+stonks:cheer"],
    [cam("jump"), cam("jump", 2, pos=[1.1, 1.28, 5.2], dur=25)],
    [suit("slump"), stonks("jump", hidden=True)], screen="p3", machine=False, chair=False))
# 17 receipt
S.append({"anchor": "The cuts are real", "component": "Shot", "theme": "light", "transition": "zoom",
    "props": {"src": "block840000_top.png", "chrome": "browser", "url": "blockchain.com/explorer/blocks/btc/840000",
              "source": "blockchain.com explorer · block 840,000", "width": 1000,
              "cam": [{"x": 0.5, "y": 0.55, "zoom": 1.0}, {"x": 0.5, "y": 0.42, "zoom": 1.3}, {"x": 0.5, "y": 0.5, "zoom": 1.08}],
              "marks": [{"beat": 0, "kind": "box", "x": 436, "y": 226, "w": 162, "h": 66}, {"beat": 1, "kind": "box", "x": 372, "y": 116, "w": 290, "h": 34}]},
    "beats": ["real:", "April", "2024,"], "long": True})
S.append(A("the next around", ["next", "2028."], "teal",
    ["screen:p3", "screen:next+suit:click"],
    [cam("fp"), cam("fp", 1, pos=[0, 1.39, 0.11], dur=40)],
    [suit("type"), stonks(hidden=True)], screen="p3", machine=False, chair=False, shift=60, transition="zoom"))
# 18 ending: the next cut, on the wall; everyone sees it coming; boss still clapping
S.append(A("Nobody decides", ["Nobody", "Everyone"], "teal",
    ["suit:shrug+label:0", "suit:point+stonks:clap"],
    [cam("wide", pos=[2.1, 1.5, 4.2], look=[0.5, 1.15, -0.3], fov=40)],
    [suit("relax"), stonks("clap")], screen="next", machine=False, chair=False,
    tags=[{"text": "next cut ~2028", "x": 540, "y": 520, "size": 70, "pill": True}]))

sb = {"slug": "the-pay-cut", "format": "skit", "genre": "office", "topic_source": "plan", "theme": "light", "tail": 1.0,
      "emphasis": ["half", "everybody claps.", "fifty", "boss walks in.", "Twenty-five!", "clap too.", "twelve and a half.",
                   "coffee machine.", "six and a quarter.", "your chair.", "three point one two five.", "Standing desk.",
                   "never been prouder.", "One problem.", "no boss.", "four years", "twenty-one million", "still clapping.",
                   "Again!", "April 2024,", "2028.", "Nobody decides it."],
      "scenes": S}
json.dump(sb, open("/home/claude/reels/episodes/2026-11-18-the-pay-cut/storyboard.json", "w"), indent=1, ensure_ascii=False)
print(len(S), "scenes")
