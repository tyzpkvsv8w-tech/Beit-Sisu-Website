// A first line of defence against ads for items our Terms of Use ban (weapons, drugs and
// steroids, counterfeits, live animals). Reports and the admin queue catch the rest.
// Words that often appear in innocent ads ("not fake", "pistol-grip seat", "rifle bag") are left out on purpose.
// Matches whole words in English and Arabic, ignoring case. Add terms with MODERATION_EXTRA_TERMS
// (comma-separated) without changing code.

const BASE_TERMS = [
  // weapons
  "firearm", "firearms", "handgun", "shotgun", "ammunition", "ammo", "airsoft", "paintball gun", "crossbow", "speargun", "spear gun", "taser", "stun gun", "pepper spray", "knuckle duster", "brass knuckles", "butterfly knife", "switchblade",
  "مسدس", "بندقية", "ذخيرة", "سلاح", "أسلحة", "صاعق كهربائي", "رذاذ الفلفل",
  // drugs and performance-enhancing substances
  "steroid", "steroids", "anabolic", "testosterone", "sarms", "hgh", "clenbuterol", "trenbolone", "nandrolone",
  "منشطات", "ستيرويد", "هرمون النمو", "تستوستيرون",
  // counterfeits
  "replica", "counterfeit", "first copy", "master copy", "AAA copy",
  "تقليد", "مقلد", "كوبي",
  // explosives and flares
  "fireworks", "flare gun", "explosive", "ألعاب نارية", "متفجرات",
  // live animals
  "puppy", "kitten", "live horse", "falcon for sale", "حصان للبيع", "صقر للبيع",
];

function terms() {
  const extra = (process.env.MODERATION_EXTRA_TERMS ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return [...BASE_TERMS, ...extra];
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The first banned term found in the text, or null. */
export function findProhibited(...texts: (string | null | undefined)[]) {
  const text = texts.filter(Boolean).join(" \n ").toLowerCase();
  for (const t of terms()) {
    // Word boundaries that also work for Arabic: start/end or a non-letter on each side.
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escape(t.toLowerCase())}($|[^\\p{L}\\p{N}])`, "u");
    if (re.test(text)) return t;
  }
  return null;
}
