"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./AcademyRPG.module.css";
import { AcademyIcon } from "@/components/icons/AcademyIcon";

type TraderClassId =
  | "price_action"
  | "risk_manager"
  | "breakout_hunter"
  | "patient_trader";

type SkillTrack = {
  id: string;
  name: string;
  icon: string;
  description: string;
  nodes: {
    id: string;
    name: string;
    requirement: string;
    requiredLevel: number;
    requiredReputation: number;
  }[];
};

const traderClasses = [
  {
    id: "price_action" as TraderClassId,
    icon: "🕯️",
    iconName: "pattern",
    tone: "cyan",
    name: "Price Action Specialist",
    difficulty: 2,
    description:
      "Masters candle closes, structural breaks, retests, and reactions around key levels.",
    perks: [
      "+10% XP from Confirmation Lab",
      "+5% Pattern Recognition rewards",
      "Exclusive Price Action quests",
      "Retest Specialist profile badge"
    ],
    requiredLevel: 1,
    requiredReputation: 0
  },
  {
    id: "risk_manager" as TraderClassId,
    icon: "🛡️",
    iconName: "risk",
    tone: "cyan",
    name: "Risk Manager",
    difficulty: 3,
    description:
      "Builds account survival through drawdown control, consistency, and planned risk.",
    perks: [
      "+2 Reputation for correct Wait decisions",
      "+10% XP from risk lessons",
      "Drawdown Defender questline",
      "Risk Manager title unlock"
    ],
    requiredLevel: 8,
    requiredReputation: 1200
  },
  {
    id: "pattern_hunter" as TraderClassId,
    icon: "〽️",
    iconName: "pattern",
    tone: "violet",
    name: "Pattern Hunter",
    difficulty: 4,
    description:
      "Specializes in recognizing clean setups, failed structures, and repeating formations.",
    perks: [
      "+15% XP from Pattern Lab",
      "Advanced formation scenarios",
      "Pattern Hunter emblem",
      "+5% daily quest rewards"
    ],
    requiredLevel: 14,
    requiredReputation: 3500
  },
  {
    id: "breakout_trader" as TraderClassId,
    icon: "⚡",
    iconName: "trade",
    tone: "gold",
    name: "Breakout Trader",
    difficulty: 5,
    description:
      "Trains momentum confirmation, expansion entries, fakeout defense, and continuation.",
    perks: [
      "+20% XP in Fakeout Arena",
      "Momentum challenge series",
      "Breakout chart atmosphere",
      "+10% Reputation from exams"
    ],
    requiredLevel: 20,
    requiredReputation: 7000
  },
  {
    id: "swing_strategist" as TraderClassId,
    icon: "🌿",
    iconName: "career",
    tone: "green",
    name: "Swing Strategist",
    difficulty: 5,
    description:
      "Focuses on higher-timeframe context, patient entries, and extended reward targets.",
    perks: [
      "+15% XP from trend scenarios",
      "Higher-timeframe Handbook track",
      "Swing Strategist title",
      "One weekly streak shield"
    ],
    requiredLevel: 27,
    requiredReputation: 12000
  },
  {
    id: "scalper_elite" as TraderClassId,
    icon: "🔻",
    iconName: "trade",
    tone: "red",
    name: "Scalper Elite",
    difficulty: 7,
    description:
      "Demands fast execution, precise stops, high accuracy, and strict overtrading control.",
    perks: [
      "Elite rapid-decision scenarios",
      "+20% XP with 80%+ accuracy",
      "Scalper Elite frame",
      "Precision Execution quests",
      "Reduced mistake penalty once daily"
    ],
    requiredLevel: 35,
    requiredReputation: 22000
  },
  {
    id: "trend_follower" as TraderClassId,
    icon: "📈",
    iconName: "statistics",
    tone: "blue",
    name: "Trend Follower",
    difficulty: 6,
    description:
      "Studies continuation, pullbacks, trend health, and when momentum has actually failed.",
    perks: [
      "+20% XP from trend drills",
      "Trend Continuation exam",
      "Dynamic chart theme",
      "+10 points on perfect sessions",
      "Trend Follower badge"
    ],
    requiredLevel: 42,
    requiredReputation: 35000
  },
  {
    id: "capital_protector" as TraderClassId,
    icon: "🏅",
    iconName: "evaluation",
    tone: "gold",
    name: "Capital Protector",
    difficulty: 8,
    description:
      "An advanced account-preservation path built around consistency and evaluation longevity.",
    perks: [
      "+25% Reputation from clean evaluation days",
      "Capital Protection questline",
      "Legendary shield emblem",
      "Evaluation recovery lesson",
      "Exclusive gold account frame"
    ],
    requiredLevel: 50,
    requiredReputation: 55000
  },
  {
    id: "psychology_master" as TraderClassId,
    icon: "🧠",
    iconName: "psychology",
    tone: "violet",
    name: "Psychology Master",
    difficulty: 8,
    description:
      "Develops emotional control, patience, recovery, and disciplined decision consistency.",
    perks: [
      "+25% XP from psychology lessons",
      "Tilt Recovery challenge",
      "Two monthly streak shields",
      "Psychology Master aura",
      "+15% Wait-decision Reputation"
    ],
    requiredLevel: 60,
    requiredReputation: 80000
  },
  {
    id: "volatility_specialist" as TraderClassId,
    icon: "〽",
    iconName: "streak",
    tone: "purple",
    name: "Volatility Specialist",
    difficulty: 9,
    description:
      "Handles rapid expansion, shifting ranges, false momentum, and unstable market structure.",
    perks: [
      "Extreme-volatility scenario pool",
      "+30% XP from Master difficulty",
      "Volatility Specialist title",
      "Animated violet profile effect",
      "Exclusive seasonal missions",
      "+15% exam Reputation"
    ],
    requiredLevel: 72,
    requiredReputation: 120000
  },
  {
    id: "news_analyst" as TraderClassId,
    icon: "📰",
    iconName: "handbook",
    tone: "blue",
    name: "News Analyst",
    difficulty: 9,
    description:
      "Studies event risk, reaction behavior, volatility spikes, and when staying out is mandatory.",
    perks: [
      "Event-Risk Handbook branch",
      "News Reaction simulator",
      "+30% XP for correct no-trade choices",
      "Analyst terminal theme",
      "Economic-event quests",
      "News Analyst badge"
    ],
    requiredLevel: 85,
    requiredReputation: 165000
  },
  {
    id: "algo_developer" as TraderClassId,
    icon: "⚙️",
    iconName: "settings",
    tone: "cyan",
    name: "Algo Developer",
    difficulty: 10,
    description:
      "The endgame path for rule-based systems, data discipline, testing, and repeatable execution.",
    perks: [
      "Rule Builder training branch",
      "Advanced statistics challenges",
      "+35% XP from perfect rule adherence",
      "Algo Developer interface theme",
      "Eight exclusive class quests",
      "Legendary animated profile emblem",
      "Seasonal research rewards"
    ],
    requiredLevel: 100,
    requiredReputation: 250000
  }
]

const skillTracks: SkillTrack[] = [
  {
    id: "pattern",
    name: "Pattern Recognition",
    icon: "🧠",
    description: "Read structure before making a decision.",
    nodes: [
      {
        id: "support_resistance",
        name: "Key-Level Reader",
        requirement: "Complete 10 scenarios",
        requiredLevel: 1,
        requiredReputation: 0
      },
      {
        id: "clean_retest",
        name: "Retest Confirmation",
        requirement: "Reach Level 3",
        requiredLevel: 3,
        requiredReputation: 100
      },
      {
        id: "fakeout",
        name: "Trap Recognition",
        requirement: "Reach Level 7",
        requiredLevel: 7,
        requiredReputation: 500
      },
      {
        id: "market_structure",
        name: "Structure Specialist",
        requirement: "Reach Level 15",
        requiredLevel: 15,
        requiredReputation: 2000
      }
    ]
  },
  {
    id: "risk",
    name: "Risk Management",
    icon: "🛡️",
    description: "Protect the evaluation before chasing profit.",
    nodes: [
      {
        id: "stop_placement",
        name: "Stop Placement",
        requirement: "Start an evaluation",
        requiredLevel: 1,
        requiredReputation: 0
      },
      {
        id: "drawdown",
        name: "Drawdown Defender",
        requirement: "Reach Level 5",
        requiredLevel: 5,
        requiredReputation: 300
      },
      {
        id: "consistency",
        name: "Consistency Control",
        requirement: "Reach Level 10",
        requiredLevel: 10,
        requiredReputation: 1200
      },
      {
        id: "evaluation_mastery",
        name: "Evaluation Mastery",
        requirement: "Reach Level 20",
        requiredLevel: 20,
        requiredReputation: 5000
      }
    ]
  },
  {
    id: "psychology",
    name: "Trader Psychology",
    icon: "🧘",
    description: "Build patience, confidence, and repeatable habits.",
    nodes: [
      {
        id: "wait",
        name: "Wait Is a Position",
        requirement: "Correctly wait 5 times",
        requiredLevel: 1,
        requiredReputation: 0
      },
      {
        id: "discipline",
        name: "Discipline Chain",
        requirement: "Reach Level 4",
        requiredLevel: 4,
        requiredReputation: 250
      },
      {
        id: "recovery",
        name: "Loss Recovery",
        requirement: "Reach Level 9",
        requiredLevel: 9,
        requiredReputation: 1000
      },
      {
        id: "professional_mindset",
        name: "Professional Mindset",
        requirement: "Reach Level 18",
        requiredLevel: 18,
        requiredReputation: 4000
      }
    ]
  }
];

const quests = [
  {
    icon: "🎯",
    title: "Confirmation Discipline",
    description: "Complete 5 simulator decisions.",
    reward: "+250 XP · +20 points",
    target: 5
  },
  {
    icon: "⏳",
    title: "Patience Practice",
    description: "Correctly choose Wait on 3 weak setups.",
    reward: "+150 XP · +15 reputation",
    target: 3
  },
  {
    icon: "🛡️",
    title: "Protect the Evaluation",
    description: "Complete 5 decisions without failing the account.",
    reward: "+400 XP · Risk Manager token",
    target: 5
  }
];

export default function AcademyRPG({
  level,
  xp,
  reputation,
  points,
  attempts,
  correctWaits,
  evaluationActive,
  onPractice,
  onCareer,
  onMarketplace
}: {
  level: number;
  xp: number;
  reputation: number;
  points: number;
  attempts: number;
  correctWaits: number;
  evaluationActive: boolean;
  onPractice: () => void;
  onCareer: () => void;
  onMarketplace: () => void;
}) {
  const [selectedClass, setSelectedClass] =
    useState<TraderClassId>("price_action");
  const [unlockedNodes, setUnlockedNodes] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedClass = window.localStorage.getItem(
        "futures-academy-trader-class"
      ) as TraderClassId | null;
      const savedNodes = window.localStorage.getItem(
        "futures-academy-skill-nodes"
      );
      if (savedClass) setSelectedClass(savedClass);
      if (savedNodes) setUnlockedNodes(JSON.parse(savedNodes));
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "futures-academy-trader-class",
      selectedClass
    );
    window.localStorage.setItem(
      "futures-academy-skill-nodes",
      JSON.stringify(unlockedNodes)
    );
  }, [selectedClass, unlockedNodes]);

  const currentClass =
    traderClasses.find(item => item.id === selectedClass) ||
    traderClasses[0];

  const availableNodes = useMemo(
    () =>
      skillTracks.flatMap(track =>
        track.nodes.filter(
          node =>
            level >= node.requiredLevel &&
            reputation >= node.requiredReputation
        )
      ),
    [level, reputation]
  );

  function unlockNode(nodeId: string) {
    if (unlockedNodes.includes(nodeId)) return;
    setUnlockedNodes(current => [...current, nodeId]);
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroGrid} />
        <div>
          <span className={styles.eyebrow}>FUTURES ACADEMY v3</span>
          <h1>Your trading career is now a progression system.</h1>
          <p>
            Choose a specialization, complete quests, unlock skill
            nodes, collect rewards, and build a permanent Academy
            identity.
          </p>

          <div className={styles.heroActions}>
            <button type="button" onClick={onPractice}>
              ▶ Continue training
            </button>
            <button type="button" onClick={onCareer}>
              View career ranks
            </button>
          </div>
        </div>

        <div className={styles.identityCard}>
          <div className={`${styles.classIcon} ${styles[`tone_${currentClass.tone}`]}`}>
            <AcademyIcon name={currentClass.iconName as any} size={42} framed />
          </div>
          <small>ACTIVE TRADER CLASS</small>
          <strong>{currentClass.name}</strong>
          <p>{currentClass.perk}</p>
          <div>
            <span>LVL {level}</span>
            <span>⭐ {reputation.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className={styles.statStrip}>
        <div>
          <span>Career XP</span>
          <strong>{xp.toLocaleString()}</strong>
        </div>
        <div>
          <span>Reputation</span>
          <strong>{reputation.toLocaleString()}</strong>
        </div>
        <div>
          <span>Academy Points</span>
          <strong>{points.toLocaleString()}</strong>
        </div>
        <div>
          <span>Skill Nodes</span>
          <strong>
            {unlockedNodes.length}/{skillTracks.reduce(
              (sum, track) => sum + track.nodes.length,
              0
            )}
          </strong>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span>TRADER SPECIALIZATION</span>
            <h2>Choose your class</h2>
            <p>
              Classes guide your progression identity. Eligibility is
              always shown before selection.
            </p>
          </div>
        </div>

        <div className={styles.classGrid}>
          {traderClasses.map(traderClass => {
            const eligible =
              level >= traderClass.requiredLevel &&
              reputation >= traderClass.requiredReputation;
            const selected = selectedClass === traderClass.id;

            return (
              <article
                className={`${styles.classCard} ${
                  selected ? styles.selected : ""
                } ${!eligible ? styles.locked : ""}`}
                key={traderClass.id}
              >
                <div className={styles.classTop}>
                  <div className={`${styles.classEmblem} ${styles[`tone_${traderClass.tone}`]}`}>
                    <AcademyIcon
                      name={traderClass.iconName as any}
                      size={30}
                      framed
                    />
                  </div>
                  <span>
                    {eligible ? "ELIGIBLE" : "LOCKED"}
                  </span>
                </div>
                <h3>{traderClass.name}</h3>
                <p>{traderClass.description}</p>
                <div className={styles.difficulty}>
                  <small>DIFFICULTY</small>
                  <div>
                    {Array.from({ length: 10 }).map((_, dot) => (
                      <i
                        key={dot}
                        className={
                          dot < traderClass.difficulty
                            ? styles.difficultyActive
                            : ""
                        }
                      />
                    ))}
                  </div>
                  <strong>{traderClass.difficulty}/10</strong>
                </div>

                <div className={styles.perk}>
                  <small>{traderClass.perks.length} CLASS PERKS</small>
                  <ul>
                    {traderClass.perks.map(perk => (
                      <li key={perk}>✦ {perk}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.requirements}>
                  <span
                    className={
                      level >= traderClass.requiredLevel
                        ? styles.met
                        : ""
                    }
                  >
                    LVL {traderClass.requiredLevel}
                  </span>
                  <span
                    className={
                      reputation >=
                      traderClass.requiredReputation
                        ? styles.met
                        : ""
                    }
                  >
                    ⭐{" "}
                    {traderClass.requiredReputation.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!eligible || selected}
                  onClick={() => setSelectedClass(traderClass.id)}
                >
                  {selected
                    ? "✓ Active class"
                    : eligible
                    ? "Select class"
                    : "Requirements not met"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span>SKILL DEVELOPMENT</span>
            <h2>Academy skill trees</h2>
            <p>
              Unlock nodes when your Level and Reputation meet the
              listed eligibility requirements.
            </p>
          </div>
          <b>{availableNodes.length} currently eligible</b>
        </div>

        <div className={styles.skillGrid}>
          {skillTracks.map(track => (
            <article className={styles.skillTrack} key={track.id}>
              <div className={styles.skillHeader}>
                <span>{track.icon}</span>
                <div>
                  <h3>{track.name}</h3>
                  <p>{track.description}</p>
                </div>
              </div>

              <div className={styles.nodeList}>
                {track.nodes.map((node, index) => {
                  const eligible =
                    level >= node.requiredLevel &&
                    reputation >= node.requiredReputation;
                  const unlocked = unlockedNodes.includes(node.id);

                  return (
                    <div
                      className={`${styles.node} ${
                        unlocked ? styles.nodeUnlocked : ""
                      } ${!eligible ? styles.nodeLocked : ""}`}
                      key={node.id}
                    >
                      <div className={styles.nodeLine}>
                        <span>{index + 1}</span>
                        {index < track.nodes.length - 1 && <i />}
                      </div>
                      <div className={styles.nodeCopy}>
                        <small>
                          {unlocked
                            ? "UNLOCKED"
                            : eligible
                            ? "ELIGIBLE"
                            : "LOCKED"}
                        </small>
                        <strong>{node.name}</strong>
                        <p>{node.requirement}</p>
                        <div>
                          <span
                            className={
                              level >= node.requiredLevel
                                ? styles.met
                                : ""
                            }
                          >
                            LVL {node.requiredLevel}
                          </span>
                          <span
                            className={
                              reputation >=
                              node.requiredReputation
                                ? styles.met
                                : ""
                            }
                          >
                            ⭐{" "}
                            {node.requiredReputation.toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={!eligible || unlocked}
                          onClick={() => unlockNode(node.id)}
                        >
                          {unlocked
                            ? "✓ Learned"
                            : eligible
                            ? "Learn skill"
                            : "Not eligible"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span>ACTIVE QUESTS</span>
            <h2>Academy assignments</h2>
            <p>
              Quests turn learning objectives into clear short-term
              goals.
            </p>
          </div>
        </div>

        <div className={styles.questGrid}>
          {quests.map((quest, index) => {
            const progress =
              index === 0
                ? Math.min(quest.target, attempts)
                : index === 1
                ? Math.min(quest.target, correctWaits)
                : evaluationActive
                ? Math.min(quest.target, attempts)
                : 0;
            const percentage = Math.min(
              100,
              (progress / quest.target) * 100
            );

            return (
              <article className={styles.questCard} key={quest.title}>
                <div className={styles.questIcon}>{quest.icon}</div>
                <div className={styles.questCopy}>
                  <span>QUEST {index + 1}</span>
                  <h3>{quest.title}</h3>
                  <p>{quest.description}</p>
                </div>
                <div className={styles.questProgress}>
                  <div>
                    <span>Progress</span>
                    <strong>
                      {progress}/{quest.target}
                    </strong>
                  </div>
                  <i>
                    <em style={{ width: `${percentage}%` }} />
                  </i>
                  <small>{quest.reward}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.collectionCallout}>
        <div>
          <span>COLLECTIONS & REWARDS</span>
          <h2>Build a permanent Academy collection.</h2>
          <p>
            Unlock profile cosmetics, account icons, titles,
            backgrounds, effects, evaluation badges, and seasonal
            trophies.
          </p>
        </div>
        <button type="button" onClick={onMarketplace}>
          Open Marketplace →
        </button>
      </section>
    </section>
  );
}
