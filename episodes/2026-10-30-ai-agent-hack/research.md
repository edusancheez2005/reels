# AI agents ran a hacking campaign (CrowdStrike, 29 Oct 2026)

Researched Fri 30 Oct 2026, 22:10-22:20 UTC. News-level facts only: who, scale, speed, why it matters. No attack techniques.

## Facts used (each with a source)

1. **Scale.** A China-linked group CrowdStrike calls Vapor Panda used an AI agent framework (ARTEX) against more than 200
   organisations in at least 14 countries, starting 17 Oct 2026, over an 11-day window.
   - https://www.crowdstrike.com/en-us/blog/vapor-panda-uses-artex-to-scale-global-campaign/ (29 Oct 2026)
   - https://thehackernews.com/2026/10/chinese-hackers-use-ai-powered-artex-to.html (30 Oct 2026)
2. **The AI.** The agents ran mainly on DeepSeek, a Chinese AI model, plus a second commercial model CrowdStrike couldn't confirm.
   A main agent coordinates planner and worker agents. (CrowdStrike blog)
3. **The human.** One human operator gave instructions in Chinese and stepped in "only to steer the agents at decision points".
   (CrowdStrike blog)
4. **How the agents behaved (high level).** They "pursued multiple attack paths in parallel" and "shifted to alternative approaches
   when a path failed". (CrowdStrike blog, quoted by The Hacker News)
5. **Targets.** Foreign ministries in Latin America, Europe, Asia and the Middle East; US semiconductor, defence, pharmaceutical,
   nuclear and financial organisations; telecom providers in the US, Belgium and the Philippines; think tanks. (CrowdStrike blog)
6. **Confirmed break-ins.** CrowdStrike "confirmed post-exploitation activity at nine organizations". (CrowdStrike blog)
7. **Speed.** CrowdStrike's Adam Meyers (CyberScoop): human hands-on-keyboard activity is typically up to ~40 commands an hour;
   "with ARTEX, we could see it exceed 1,500 commands an hour". Also: "the first time that we're seeing an agentic adversary
   nation-state threat actor at this scale".
   - https://cyberscoop.com/china-vapor-panda-agentic-ai-artex-campaign-crowdstrike/ (30 Oct 2026)
8. **Trend.** CrowdStrike counted about 45 agentic adversary attacks in September and 126 so far in October. (CyberScoop)
9. **A year ago.** In November 2025 Anthropic reported the first known AI-orchestrated cyber-espionage campaign, by a Chinese
   state-sponsored group using its Claude Code tool against about 30 organisations; a few succeeded.
   - https://www.theregister.com/2025/11/13/chinese_spies_claude_attacks/
   - https://siliconangle.com/2025/11/13/anthropic-reveals-first-reported-ai-orchestrated-cyber-espionage-campaign-using-claude/
10. **Defence advice (general).** CrowdStrike's recommendations include patching internet-facing systems and changing old keys
    and passwords after any exposure; the group also tried password-spraying at 12+ more organisations (two-factor logins stop
    most of that). (CrowdStrike blog)

## Derived numbers shown on screen (for traceability)
- "~37× faster" = 1,500 / 40 = 37.5 (fact 7).
- "~7× in a year" = 200 / ~30 = 6.7, shown as ~7 (facts 9 and 1); earlier draft rounded to ×6, which understates.

## Deliberately not used
- Any description of the intrusion techniques or indicators: not needed to tell the story, and not something to broadcast.
- CyberScoop's "140 compromised": CrowdStrike's own post confirms nine; the 140 figure mixes confirmed and moderate-confidence cases.
- No claim that China's government ordered it: CrowdStrike says "China-linked" / China-nexus; we say "China-linked".
