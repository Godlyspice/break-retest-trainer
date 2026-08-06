"use client";

import styles from "./EmptyLeaderboard.module.css";

export default function EmptyLeaderboard({
  title,
  description,
  icon = "🏆",
  actionLabel,
  onAction
}: {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className={styles.empty}>
      <div className={styles.icon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}
