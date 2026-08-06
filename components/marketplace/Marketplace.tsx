"use client";

import { useMemo, useState } from "react";
import {
  marketplaceCatalog,
  marketplaceCategories,
  type MarketplaceCategory,
  type MarketplaceItem
} from "@/lib/marketplace";
import styles from "./Marketplace.module.css";

type EquippedItems = Partial<Record<MarketplaceItem["slot"], string>>;

export default function Marketplace({
  points,
  level,
  reputation,
  premium,
  ownedItems,
  equippedItems,
  message,
  onBuy,
  onEquip
}: {
  points: number;
  level: number;
  reputation: number;
  premium: boolean;
  ownedItems: string[];
  equippedItems: EquippedItems;
  message: string;
  onBuy: (item: MarketplaceItem) => void;
  onEquip: (item: MarketplaceItem) => void;
}) {
  const [category, setCategory] =
    useState<MarketplaceCategory>("All");
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("All");

  const visible = useMemo(() => {
    return marketplaceCatalog.filter(item => {
      const categoryMatch =
        category === "All" || item.category === category;
      const rarityMatch = rarity === "All" || item.rarity === rarity;
      const searchMatch =
        !query.trim() ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());
      return categoryMatch && rarityMatch && searchMatch;
    });
  }, [category, query, rarity]);

  return (
    <section className={styles.marketplace}>
      <div className={styles.hero}>
        <div>
          <span>ACADEMY REWARDS</span>
          <h2>Marketplace</h2>
          <p>
            Spend points on account icons, badges, titles, frames,
            backgrounds, profile effects, and full interface themes.
          </p>
        </div>
        <div className={styles.balance}>🪙 {points.toLocaleString()} points</div>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.controls}>
        <div className={styles.search}>
          <span>🔎</span>
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search rewards"
          />
        </div>
        <select
          value={rarity}
          onChange={event => setRarity(event.target.value)}
        >
          <option>All</option>
          <option>Common</option>
          <option>Uncommon</option>
          <option>Rare</option>
          <option>Epic</option>
          <option>Legendary</option>
        </select>
      </div>

      <div className={styles.categories}>
        {marketplaceCategories.map(item => (
          <button
            key={item}
            type="button"
            className={category === item ? styles.activeCategory : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={styles.summary}>
        <span>{visible.length} obtainable rewards</span>
        <span>{ownedItems.length} owned</span>
        <span>{Object.keys(equippedItems).length} equipped</span>
      </div>

      <div className={styles.grid}>
        {visible.map(item => {
          const owned = ownedItems.includes(item.id);
          const equipped = equippedItems[item.slot] === item.id;
          const lockedByLevel =
            typeof item.minLevel === "number" && level < item.minLevel;
          const lockedByReputation =
            typeof item.minReputation === "number" &&
            reputation < item.minReputation;
          const lockedByPremium = Boolean(item.premiumOnly && !premium);
          const locked =
            lockedByLevel || lockedByReputation || lockedByPremium;

          let requirement = "";
          if (lockedByPremium) requirement = "Premium required";
          else if (lockedByLevel) requirement = `Level ${item.minLevel} required`;
          else if (lockedByReputation) {
            requirement = `${item.minReputation?.toLocaleString()} reputation required`;
          }

          return (
            <article
              className={`${styles.card} ${styles[item.rarity.toLowerCase()]} ${
                owned ? styles.owned : ""
              }`}
              key={item.id}
            >
              <div className={styles.cardTop}>
                <div className={styles.icon}>{item.icon}</div>
                <div>
                  <span>{item.category}</span>
                  <h3>{item.name}</h3>
                </div>
                <b>{item.rarity}</b>
              </div>

              <p>{item.description}</p>

              <div className={styles.meta}>
                {item.minLevel && <span>LVL {item.minLevel}</span>}
                {item.minReputation && (
                  <span>⭐ {item.minReputation.toLocaleString()}</span>
                )}
                {item.premiumOnly && <span>Premium</span>}
              </div>

              {equipped ? (
                <button className={styles.equippedButton} disabled>
                  ✓ Equipped
                </button>
              ) : owned ? (
                <button
                  className={styles.equipButton}
                  type="button"
                  onClick={() => onEquip(item)}
                >
                  Equip
                </button>
              ) : locked ? (
                <button className={styles.lockedButton} disabled>
                  🔒 {requirement}
                </button>
              ) : (
                <button
                  className={styles.buyButton}
                  type="button"
                  onClick={() => onBuy(item)}
                >
                  Buy · {item.price.toLocaleString()} pts
                </button>
              )}
            </article>
          );
        })}
      </div>

      {!visible.length && (
        <div className={styles.empty}>
          No rewards match the selected filters.
        </div>
      )}
    </section>
  );
}
