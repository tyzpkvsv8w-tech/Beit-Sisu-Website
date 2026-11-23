// Sample data for development. Run with: npm run db:seed
// Every account below uses the password "rekit-demo-123". Never run this against production.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const H = 3600e3, D = 24 * H;
const ago = (ms) => new Date(Date.now() - ms);

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed in production");
  await db.$transaction([
    db.message.deleteMany(), db.conversation.deleteMany(), db.favorite.deleteMany(), db.report.deleteMany(),
    db.photo.deleteMany(), db.listing.deleteMany(), db.session.deleteMany(), db.user.deleteMany(),
    db.adCampaign.deleteMany(), db.adEnquiry.deleteMany(),
  ]);
  const passwordHash = await bcrypt.hash("rekit-demo-123", 10);
  const mk = (email, name, extra = {}) => db.user.create({ data: { email, name, passwordHash, city: "Dubai", ...extra } });

  const admin = await mk("admin@rekit.test", "ReKit Admin", { role: "ADMIN" });
  const people = {};
  for (const [key, name, city, phone] of [
    ["omar", "Omar K.", "Dubai", "+971 50 123 4567"], ["priya", "Priya S.", "Dubai"], ["james", "James W.", "Abu Dhabi"],
    ["hassan", "Hassan A.", "Dubai"], ["lena", "Lena M.", "Dubai", "+971 55 987 6543"], ["rami", "Rami T.", "Sharjah"],
    ["aisha", "Aisha R.", "Dubai"], ["vikram", "Vikram P.", "Ajman"], ["sophie", "Sophie L.", "Abu Dhabi"], ["fatima", "Fatima Z.", "Sharjah"],
  ]) {
    people[key] = await mk(`${key}@rekit.test`, name, { city, phone: phone ?? null, showPhone: !!phone, createdAt: ago((200 + Math.random() * 600) * D) });
  }
  const shops = {
    bike: await mk("bikes@rekit.test", "Marina Bike Lab", { isBusiness: true }),
    padel: await mk("padel@rekit.test", "Al Quoz Padel Store", { isBusiness: true }),
    gym: await mk("gym@rekit.test", "Gulf Gym Supply", { isBusiness: true, city: "Abu Dhabi" }),
  };

  const L = (seller, sport, title, price, condition, city, area, brand, size, age, negotiable, description) =>
    ({ sellerId: seller.id, sport, title, price, condition, city, area, brand, size, negotiable, description, createdAt: ago(age) });

  const p = people;
  const listings = [
    L(p.omar, "padel-tennis", "Bullpadel Vertex 03 padel racket + cover", 650, "Like new", "Dubai", "Jumeirah Village Circle", "Bullpadel", "Standard, 365 g", 2 * H, true, "Used for about 10 sessions, switched to a lighter racket. No chips on the frame. Comes with the original thermo cover and a new overgrip.\n\nCan meet in Al Quoz or JVC."),
    L(p.priya, "cycling", "Specialized Allez road bike, 54 cm, Shimano Claris", 1900, "Good", "Dubai", "Al Barsha", "Specialized", "54 cm frame", 5 * H, true, "Great first road bike for Al Qudra. Serviced in September, new chain and bar tape. A few cosmetic scratches on the top tube.\n\nPedals not included."),
    L(p.james, "gym", "Adjustable dumbbells 2.5–24 kg (pair)", 1100, "Like new", "Abu Dhabi", "Al Reem Island", "Bowflex SelectTech 552", "2.5–24 kg each", 9 * H, false, "Moving abroad, must go. Pair of dial-adjustable dumbbells with stands. Work perfectly."),
    L(p.hassan, "golf", "Full set TaylorMade irons 5–PW, stiff shafts", 1450, "Good", "Dubai", "Emirates Hills", "TaylorMade", "Right-handed, stiff", 1 * D, true, "Irons 5, 6, 7, 8, 9 and PW. Grips replaced last year. Normal wear on the soles. Bag not included but can do a deal."),
    L(p.lena, "water", "Kitesurf kite 12 m with bar and lines", 2200, "Good", "Dubai", "Umm Suqeim", "Duotone Evo", "12 m²", 1 * D + 4 * H, true, "2022 model, no repairs, holds air overnight. Bar and lines in good shape. Perfect for Kite Beach winter wind."),
    L(p.rami, "football", "Nike Phantom GX boots, UK 9, FG", 220, "Like new", "Sharjah", "Al Majaz", "Nike", "UK 9 / EU 44", 2 * D, false, "Worn twice on grass. Bought the wrong size. Box included."),
    L(p.aisha, "running", "Garmin Forerunner 255 GPS running watch", 650, "Good", "Dubai", "Dubai Marina", "Garmin", "46 mm", 2 * D + 3 * H, true, "Battery still lasts about 10 days. Light scratch on the bezel. Charger included."),
    L(p.vikram, "cricket", "English willow cricket bat, short handle + pads", 480, "Good", "Ajman", "Al Nuaimiya", "Gray-Nicolls", "SH, 2 lb 9 oz", 3 * D, true, "Knocked in and oiled. Includes batting pads and gloves (right-handed)."),
    L(p.hassan, "basketball", "Portable basketball hoop, height adjustable", 700, "Well used", "Dubai", "Arabian Ranches", "Lifetime", "2.3–3.05 m", 3 * D + 6 * H, true, "Some sun fading on the backboard. Base fills with water or sand. You collect; it needs two people and an SUV."),
    L(p.james, "combat", "Boxing gloves 14 oz, wraps and focus pads", 180, "Good", "Abu Dhabi", "Khalifa City", "Venum", "14 oz", 4 * D, false, "Gloves, two pairs of wraps and a set of curved focus pads. Cleaned and sanitised."),
    L(p.lena, "snow", "Ski boots + skis 160 cm, great for Ski Dubai", 900, "Good", "Dubai", "Mirdif", "Rossignol", "Boot 26.5, skis 160 cm", 5 * D, true, "Bindings set for a 26.5 boot, easy to adjust. Saves hiring every weekend."),
    L(p.fatima, "outdoor", "4-person tent + 2 sleeping bags (desert camping)", 350, "Like new", "Ras Al Khaimah", "Mina Al Arab", "Coleman", "4 person", 6 * D, true, "Used one weekend in Jebel Jais. Packed away clean."),
    L(p.sophie, "padel-tennis", "Wilson Pro Staff tennis racket, grip L3", 420, "Good", "Abu Dhabi", "Saadiyat", "Wilson", "Grip L3, 97 sq in", 6 * H, true, "Freshly strung with poly at 24 kg. Minor paint chips on the head."),
    L(p.fatima, "cycling", "Kids' mountain bike 24\", 21-speed", 380, "Good", "Sharjah", "Aljada", "Trek", "24\" wheels", 1 * D + 9 * H, true, "Outgrown. New tyres in the summer. Ideal for ages 8–12."),
    L(p.priya, "gym", "Concept2 rowing machine, Model D, PM5", 3200, "Good", "Dubai", "Business Bay", "Concept2", "Model D", 2 * D + 8 * H, true, "About 800 km on the monitor. Chain cleaned and oiled. Splits into two for transport."),
    L(p.lena, "water", "Inflatable stand-up paddleboard 10'6\" with pump", 750, "Like new", "Fujairah", "Dibba", "Aqua Marina", "10'6\"", 4 * D + 2 * H, false, "Board, paddle, leash, pump and backpack. No punctures."),
    L(p.aisha, "running", "Nike Vaporfly 3, UK 8, under 100 km", 450, "Like new", "Dubai", "Downtown", "Nike", "UK 8 / EU 42.5", 7 * D, true, "Raced one half marathon in them. Foam still bouncy."),
    L(p.hassan, "golf", "Golf push trolley, 3-wheel, foldable", 260, "Good", "Al Ain", "Al Jimi", "Clicgear", "Standard", 8 * D, true, "Folds flat. Includes umbrella holder and scorecard holder."),
    L(p.rami, "football", "Pop-up goals pair + 10 cones + ball pump", 150, "Good", "Dubai", "Dubai Silicon Oasis", "Kickmaster", "1.2 m goals", 9 * D, false, "Good for kids' training in the park. One goal has a small tear in the net."),
    L(p.vikram, "combat", "Freestanding punch bag with base", 600, "Well used", "Dubai", "Al Furjan", "Everlast", "170 cm", 10 * D, true, "Base fills with water. Some cracking on the vinyl near the top, still solid."),
  ];
  const created = [];
  for (const data of listings) created.push(await db.listing.create({ data }));

  const until = new Date(Date.now() + 60 * D);
  for (const data of [
    { ...L(shops.bike, "cycling", "Certified pre-owned road bikes, inspected & serviced", 1499, "Like new", "Dubai", "Al Quoz", "Mixed brands", "All sizes", 0, true, "Every bike inspected, serviced and backed by a 3-month workshop warranty. Trade in your old bike towards the price."), sponsoredUntil: until },
    { ...L(shops.padel, "padel-tennis", "Demo padel rackets at half price", 399, "Like new", "Dubai", "Al Quoz", "Mixed brands", "Try before you buy", 0, false, "Rackets from our demo wall, used for test hits only. Book a free fitting session."), sponsoredUntil: until },
    { ...L(shops.gym, "gym", "Ex-hotel commercial treadmills, delivered & installed", 3900, "Good", "Abu Dhabi", "Mussafah", "Commercial grade", "Commercial", 0, true, "Refurbished commercial cardio from hotel gym upgrades. Delivery and installation included anywhere in the UAE."), sponsoredUntil: until },
  ]) await db.listing.create({ data });

  // A sample conversation so the inbox isn't empty for the demo buyer.
  const convo = await db.conversation.create({ data: { listingId: created[0].id, buyerId: p.priya.id, sellerId: p.omar.id } });
  await db.message.createMany({ data: [
    { conversationId: convo.id, senderId: p.priya.id, body: "Hi Omar, is the Vertex still available?", createdAt: ago(90 * 60e3), readAt: ago(80 * 60e3) },
    { conversationId: convo.id, senderId: p.omar.id, body: "Yes it is! Happy to meet in JVC this evening.", createdAt: ago(70 * 60e3) },
  ] });
  await db.favorite.createMany({ data: [{ userId: p.priya.id, listingId: created[4].id }, { userId: p.priya.id, listingId: created[6].id }] });

  const start = ago(D), end = new Date(Date.now() + 60 * D);
  // Advertisers are fictional sample businesses.
  await db.adCampaign.createMany({ data: [
    { advertiser: "Kite Beach Academy", headline: "Learn to kitesurf this winter", body: "Certified lessons at Kite Beach, gear included. Beginners welcome.", ctaLabel: "See lessons", ctaUrl: "https://example.com/kite", placement: "HOME_BANNER", startsAt: start, endsAt: end },
    { advertiser: "Kite Beach Academy", headline: "Lessons from AED 350", body: "Two-hour beginner sessions every weekend.", ctaLabel: "Book a lesson", ctaUrl: "https://example.com/kite", placement: "SPORT_TAKEOVER", sport: "water", startsAt: start, endsAt: end },
    { advertiser: "Desert Trail Runners", headline: "Training plans for your first ultra", body: "Weekly group runs in Al Qudra and Hatta. First month free.", ctaLabel: "Join a run", ctaUrl: "https://example.com/run", placement: "INFEED", startsAt: start, endsAt: end },
    { advertiser: "Fairway Fitting Studio", headline: "Custom club fitting in 45 minutes", body: "Launch monitor session, AED 200 off any new set.", ctaLabel: "Book a fitting", ctaUrl: "https://example.com/golf", placement: "SPORT_TAKEOVER", sport: "golf", startsAt: start, endsAt: end },
    { advertiser: "Spin Cycle Service", headline: "Full bike service, collected from your door", body: "Pickup and drop-off across Dubai and Sharjah.", ctaLabel: "Book a service", ctaUrl: "https://example.com/bike", placement: "LISTING_SIDE", startsAt: start, endsAt: end },
  ] });

  console.log(`Seeded ${created.length + 3} listings, ${Object.keys(people).length + 4} users. Admin: ${admin.email}`);
}

main().finally(() => db.$disconnect());
