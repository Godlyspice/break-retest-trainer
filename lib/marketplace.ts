export type MarketplaceCategory =
  | "All"
  | "Account Icons"
  | "Badges"
  | "Titles"
  | "Profile Frames"
  | "Backgrounds"
  | "Effects"
  | "Themes";

export type MarketplaceRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary";

export type MarketplaceItem = {
  id: string;
  category: Exclude<MarketplaceCategory, "All">;
  slot:
    | "accountIcon"
    | "badge"
    | "title"
    | "profileFrame"
    | "background"
    | "effect"
    | "theme";
  name: string;
  description: string;
  price: number;
  icon: string;
  rarity: MarketplaceRarity;
  minLevel?: number;
  minReputation?: number;
  premiumOnly?: boolean;
};

export const marketplaceCategories: MarketplaceCategory[] = [
  "All",
  "Account Icons",
  "Badges",
  "Titles",
  "Profile Frames",
  "Backgrounds",
  "Effects",
  "Themes"
];

export const marketplaceCatalog: MarketplaceItem[] = [
  { id: "icon_bull", category: "Account Icons", slot: "accountIcon", name: "Bull Crest", description: "Classic bullish Academy account icon.", price: 250, icon: "🐂", rarity: "Common" },
  { id: "icon_bear", category: "Account Icons", slot: "accountIcon", name: "Bear Crest", description: "Classic bearish Academy account icon.", price: 250, icon: "🐻", rarity: "Common" },
  { id: "icon_candle", category: "Account Icons", slot: "accountIcon", name: "Golden Candle", description: "A polished candle for disciplined chart readers.", price: 500, icon: "🕯️", rarity: "Uncommon", minLevel: 3 },
  { id: "icon_chart", category: "Account Icons", slot: "accountIcon", name: "Chart Pulse", description: "A chart icon for active simulator traders.", price: 650, icon: "📈", rarity: "Uncommon", minLevel: 5 },
  { id: "icon_lightning", category: "Account Icons", slot: "accountIcon", name: "Momentum Bolt", description: "Fast and aggressive visual identity.", price: 900, icon: "⚡", rarity: "Rare", minReputation: 250 },
  { id: "icon_compass", category: "Account Icons", slot: "accountIcon", name: "Market Compass", description: "For traders who value process over prediction.", price: 1100, icon: "🧭", rarity: "Rare", minLevel: 10 },
  { id: "icon_crown", category: "Account Icons", slot: "accountIcon", name: "Academy Crown", description: "Elite profile icon reserved for proven members.", price: 3000, icon: "👑", rarity: "Legendary", minLevel: 25, minReputation: 5000 },

  { id: "badge_risk", category: "Badges", slot: "badge", name: "Risk Manager", description: "Shows commitment to controlled risk.", price: 500, icon: "🛡️", rarity: "Uncommon", minLevel: 3 },
  { id: "badge_patience", category: "Badges", slot: "badge", name: "Patience Pro", description: "Awarded to traders who respect the Wait decision.", price: 500, icon: "⏳", rarity: "Uncommon", minLevel: 3 },
  { id: "badge_retest", category: "Badges", slot: "badge", name: "Retest Specialist", description: "Dedicated break-and-retest recognition badge.", price: 900, icon: "🎯", rarity: "Rare", minLevel: 8 },
  { id: "badge_fakeout", category: "Badges", slot: "badge", name: "Trap Spotter", description: "For members who master failed breakouts.", price: 1000, icon: "↩️", rarity: "Rare", minReputation: 500 },
  { id: "badge_consistent", category: "Badges", slot: "badge", name: "Consistency First", description: "Highlights steady performance over oversized wins.", price: 1400, icon: "⚖️", rarity: "Epic", minLevel: 15, minReputation: 1500 },
  { id: "badge_drawdown", category: "Badges", slot: "badge", name: "Drawdown Defender", description: "A badge for protecting evaluation accounts.", price: 1600, icon: "📉", rarity: "Epic", minLevel: 18 },
  { id: "badge_founder", category: "Badges", slot: "badge", name: "Early Academy Member", description: "A launch-era supporter badge.", price: 3500, icon: "🏛️", rarity: "Legendary", premiumOnly: true },

  { id: "title_chart_reader", category: "Titles", slot: "title", name: "Chart Reader", description: "A clean beginner title.", price: 300, icon: "📊", rarity: "Common" },
  { id: "title_level_guardian", category: "Titles", slot: "title", name: "Level Guardian", description: "Protects key levels with patience.", price: 700, icon: "🔷", rarity: "Uncommon", minLevel: 5 },
  { id: "title_retest_hunter", category: "Titles", slot: "title", name: "Retest Hunter", description: "Recognizes confirmation after the return.", price: 900, icon: "🏹", rarity: "Rare", minLevel: 8 },
  { id: "title_risk_first", category: "Titles", slot: "title", name: "Risk First", description: "Risk management comes before reward.", price: 1100, icon: "🧱", rarity: "Rare", minReputation: 750 },
  { id: "title_market_technician", category: "Titles", slot: "title", name: "Market Technician", description: "A professional analytical title.", price: 2000, icon: "🧪", rarity: "Epic", minLevel: 20, minReputation: 3000 },
  { id: "title_academy_elite", category: "Titles", slot: "title", name: "Academy Elite", description: "An endgame title for advanced progression.", price: 5000, icon: "🏆", rarity: "Legendary", minLevel: 35, minReputation: 10000 },

  { id: "frame_steel", category: "Profile Frames", slot: "profileFrame", name: "Steel Border", description: "A clean metallic profile frame.", price: 650, icon: "⬜", rarity: "Uncommon" },
  { id: "frame_blue", category: "Profile Frames", slot: "profileFrame", name: "Academy Blue", description: "Signature blue Academy profile frame.", price: 850, icon: "🔵", rarity: "Rare", minLevel: 6 },
  { id: "frame_emerald", category: "Profile Frames", slot: "profileFrame", name: "Profit Emerald", description: "A green frame inspired by profitable sessions.", price: 1200, icon: "🟢", rarity: "Rare", minReputation: 800 },
  { id: "frame_violet", category: "Profile Frames", slot: "profileFrame", name: "Elite Violet", description: "Violet frame for higher-ranked members.", price: 1800, icon: "🟣", rarity: "Epic", minLevel: 18 },
  { id: "frame_gold", category: "Profile Frames", slot: "profileFrame", name: "Legend Gold", description: "Animated-looking gold prestige frame.", price: 4500, icon: "🟡", rarity: "Legendary", minLevel: 30, minReputation: 8000 },

  { id: "background_floor", category: "Backgrounds", slot: "background", name: "Trading Floor", description: "Dark professional trading-floor background.", price: 1000, icon: "🏙️", rarity: "Rare" },
  { id: "background_midnight", category: "Backgrounds", slot: "background", name: "Midnight Charts", description: "Deep navy chart-grid background.", price: 1200, icon: "🌙", rarity: "Rare", minLevel: 8 },
  { id: "background_sunrise", category: "Backgrounds", slot: "background", name: "Opening Bell", description: "Warm sunrise before the market opens.", price: 1500, icon: "🌅", rarity: "Epic", minLevel: 12 },
  { id: "background_city", category: "Backgrounds", slot: "background", name: "Market Skyline", description: "Modern city and exchange skyline.", price: 1800, icon: "🌆", rarity: "Epic", minReputation: 1500 },
  { id: "background_vault", category: "Backgrounds", slot: "background", name: "Account Vault", description: "High-security evaluation vault visual.", price: 2300, icon: "🏦", rarity: "Epic", minLevel: 20 },
  { id: "background_legend", category: "Backgrounds", slot: "background", name: "Academy Hall", description: "Prestige hall reserved for Academy veterans.", price: 5000, icon: "🏛️", rarity: "Legendary", minLevel: 35, minReputation: 12000 },

  { id: "effect_neon", category: "Effects", slot: "effect", name: "Neon Pulse", description: "Subtle animated neon profile glow.", price: 1400, icon: "✨", rarity: "Epic", minLevel: 12 },
  { id: "effect_candles", category: "Effects", slot: "effect", name: "Candle Rain", description: "Faint moving candle particles.", price: 1800, icon: "🕯️", rarity: "Epic", minLevel: 16 },
  { id: "effect_sparks", category: "Effects", slot: "effect", name: "Momentum Sparks", description: "Electric sparks around the profile frame.", price: 2200, icon: "⚡", rarity: "Epic", minReputation: 2500 },
  { id: "effect_gold", category: "Effects", slot: "effect", name: "Legend Aura", description: "Premium golden aura for top members.", price: 5500, icon: "🌟", rarity: "Legendary", minLevel: 40, minReputation: 15000, premiumOnly: true },

  { id: "theme_terminal", category: "Themes", slot: "theme", name: "Terminal Green", description: "Retro dark terminal color treatment.", price: 1800, icon: "💻", rarity: "Epic", minLevel: 15 },
  { id: "theme_ice", category: "Themes", slot: "theme", name: "Ice Exchange", description: "Cold blue and silver interface theme.", price: 2200, icon: "❄️", rarity: "Epic", minLevel: 20 },
  { id: "theme_crimson", category: "Themes", slot: "theme", name: "Crimson Market", description: "Deep red professional trading theme.", price: 2600, icon: "🔴", rarity: "Epic", minReputation: 3500 },
  { id: "theme_gold", category: "Themes", slot: "theme", name: "Founder Gold", description: "Prestige gold interface theme.", price: 6500, icon: "👑", rarity: "Legendary", minLevel: 45, minReputation: 20000, premiumOnly: true }
];
