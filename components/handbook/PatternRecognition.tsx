"use client";

import styles from "./PatternRecognition.module.css";

export type PatternMode =
  | "mixed"
  | "clean"
  | "fakeouts"
  | "wait";

const patterns = [
  {
    id: "bull-retest",
    icon: "↗",
    title: "Bullish Break and Retest",
    difficulty: "Beginner",
    mode: "clean" as PatternMode,
    summary:
      "Price closes above resistance, returns to the level, holds it as support, and confirms upward.",
    checklist: [
      "Meaningful close above the level",
      "Controlled return toward the level",
      "Retest holds instead of closing back below",
      "Bullish confirmation after the retest"
    ],
    avoid:
      "Do not enter only because a candle wicked above resistance."
  },
  {
    id: "bear-retest",
    icon: "↘",
    title: "Bearish Break and Retest",
    difficulty: "Beginner",
    mode: "clean" as PatternMode,
    summary:
      "Price closes below support, returns to the level, rejects it as resistance, and confirms downward.",
    checklist: [
      "Meaningful close below support",
      "Return toward the broken level",
      "Retest rejects instead of reclaiming",
      "Bearish confirmation after rejection"
    ],
    avoid:
      "A single wick below support is not enough to confirm a breakdown."
  },
  {
    id: "bull-fakeout",
    icon: "↩",
    title: "Bull Trap / Failed Breakout",
    difficulty: "Intermediate",
    mode: "fakeouts" as PatternMode,
    summary:
      "Price briefly trades above resistance but quickly closes back below, trapping breakout buyers.",
    checklist: [
      "Break lacks follow-through",
      "Price closes back inside the range",
      "Retest from below fails",
      "Momentum shifts in the opposite direction"
    ],
    avoid:
      "Wait for the reclaim failure before assuming every breakout is fake."
  },
  {
    id: "bear-fakeout",
    icon: "↪",
    title: "Bear Trap / Failed Breakdown",
    difficulty: "Intermediate",
    mode: "fakeouts" as PatternMode,
    summary:
      "Price moves below support, then quickly reclaims the level and traps late sellers.",
    checklist: [
      "Breakdown fails to continue",
      "Price closes back above support",
      "Level holds after the reclaim",
      "Bullish confirmation develops"
    ],
    avoid:
      "Do not buy only because price wicked below support."
  },
  {
    id: "chop",
    icon: "〰",
    title: "Chop / No-Trade Structure",
    difficulty: "Essential",
    mode: "wait" as PatternMode,
    summary:
      "Price repeatedly crosses the same level without clean closes, follow-through, or directional control.",
    checklist: [
      "Repeated overlapping candles",
      "Breaks fail in both directions",
      "No clean retest structure",
      "Reward-to-risk is unclear"
    ],
    avoid:
      "Forcing trades in chop teaches bad habits. Wait is the correct pattern."
  },
  {
    id: "early-entry",
    icon: "⏱",
    title: "Early Entry Warning",
    difficulty: "Essential",
    mode: "mixed" as PatternMode,
    summary:
      "A level has broken, but the retest or confirmation has not happened yet.",
    checklist: [
      "Break is visible",
      "Retest has not completed",
      "Confirmation candle is missing",
      "Entry would rely on prediction"
    ],
    avoid:
      "A valid idea can still be a bad trade when entered before confirmation."
  }
];

export default function PatternRecognition({
  onPractice
}: {
  onPractice: (mode: PatternMode) => void;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <span>PATTERN RECOGNITION</span>
        <h2>Learn what to look for before you trade</h2>
        <p>
          Use the checklist, study the simplified candle diagram, then launch
          the matching simulator drill.
        </p>
      </div>

      <div className={styles.grid}>
        {patterns.map(pattern => (
          <article className={styles.card} key={pattern.id}>
            <div className={styles.top}>
              <div className={styles.icon}>{pattern.icon}</div>
              <div>
                <span>{pattern.difficulty}</span>
                <h3>{pattern.title}</h3>
              </div>
            </div>

            <div className={`${styles.diagram} ${styles[pattern.id]}`}>
              <i /><i /><i /><i /><i /><i />
              <b>KEY LEVEL</b>
            </div>

            <p>{pattern.summary}</p>

            <div className={styles.checklist}>
              {pattern.checklist.map(item => (
                <span key={item}>✓ {item}</span>
              ))}
            </div>

            <div className={styles.warning}>
              <strong>Common mistake</strong>
              <span>{pattern.avoid}</span>
            </div>

            <button type="button" onClick={() => onPractice(pattern.mode)}>
              Practice this pattern →
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
