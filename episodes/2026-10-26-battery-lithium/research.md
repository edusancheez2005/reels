# The wall inside your phone battery — sources (checked 2026-10-26)

v2 (after Edu's feedback: better hook, realistic 3D visuals). v1 script/storyboard kept in `v1/`.

## Facts on screen / in the voice-over

1. **Separator = a thin plastic film between the electrodes.** "Although ions pass freely between the electrodes, the separator is an isolator with no electrical conductivity." Li-ion separators are polyolefin (polyethylene, polypropylene). Typical thickness about 25 µm, some now 12 µm. — Battery University BU-306: https://batteryuniversity.com/article/bu-306-what-is-the-function-of-the-separator
2. **Human hair diameter:** 15–110 µm (Kaswell 1953) and 40–120 µm (Randebrook 1964). — BioNumbers 116402 (Harvard): https://bionumbers.hms.harvard.edu/bionumber.aspx?id=116402
   → Script says "thinner than *most* human hairs" (12–25 µm vs typical 40–120 µm; the very finest hairs overlap, so not "any hair"). The Hair3D scene is labelled "Illustration to scale: hair ≈ 80 µm, separator ≈ 20 µm" (mid-range values of the two sources).
3. **Separator failure → fire.** "Defects in the cell that compromise the separator's integrity can cause an internal short circuit condition." "Thermal runaway is a phenomenon in which the lithium-ion cell enters an uncontrollable, self-heating state." "Thermal runaway can result in extremely high temperatures, violent cell venting, smoke and fire." — UL Research Institutes: https://ul.org/research-updates/what-causes-thermal-runaway/
   → "If it fails, your phone can catch fire"; "electrons take the shortcut"; "heating itself, faster and faster, until it vents, smokes and burns."
4. **How a Li-ion cell works.** Anode "commonly made out of graphite"; cathode "typically a combination of nickel, manganese, and cobalt oxides"; separator "prevents contact between the anode and cathode"; electrolyte moves lithium ions; in use ions move anode → cathode; charging reverses. — Argonne National Laboratory: https://www.anl.gov/science-101/batteries
5. **Electrons go round the outside.** "electrons travel from the anode to the cathode through the external circuit… the positive lithium ions travel through the electrolyte from anode to cathode"; reverse on recharge. — Chemistry World, 9 Oct 2019: https://www.chemistryworld.com/news/why-have-lithium-ion-batteries-just-won-the-chemistry-nobel-prize/4010479.article
6. **Galaxy Note 7.** Samsung's investigation: Battery A — negative electrode deflected in the upper right corner, contacting the positive electrode; Battery B — "a high welding burr on the positive electrode that penetrated a layer of insulating tape and a separator", contacting the negative electrode. Samsung "successfully recalled 96 per cent of the three million Note 7s sold." — The Engineer, Jan 2017: https://www.theengineer.co.uk/samsung-delivers-post-mortem-on-note-7-battery-malfunctions
   Samsung "recalled every device it had sold"; separator described as "troublingly thin… could be easily damaged" (one battery type). — MIT Technology Review, 23 Jan 2017: https://www.technologyreview.com/2017/01/23/154440/samsung-explains-the-details-behind-the-galaxy-note-7s-fiery-end/
   → Script: "In 2016, a tiny metal burr pierced that wall inside *some* Samsung batteries. Samsung recalled every Galaxy Note 7, about three million phones." (Only battery B had the burr — hence "some".) Recall was announced in 2016; findings published Jan 2017.

## Deliberate simplifications
- "Each lithium atom leaves an electron behind": on discharge lithium leaves graphite as Li⁺; its electron goes through the external circuit (fact 5).
- Visuals are illustrations (labelled): the phone is a generic, unbranded 3D model; the cell cross-section, ion counts and the heat sequence are schematic. The lock screen reading "82%" is illustrative.
- The "3,000,000" counter = "three million Note 7s sold" (The Engineer); voice says "about".
- NOT used: temperatures, how fast thermal runaway happens, injury/fire counts (not sourced here).
- Samsung logo from Simple Icons (referential use, no endorsement implied).
