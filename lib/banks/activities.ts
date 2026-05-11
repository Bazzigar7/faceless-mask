// lib/banks/activities.ts
import type { Activity } from "./types";

export const ACTIVITY_BANK: Activity[] = [
  // Classic Indian school games (rebranded for blockchain) — 8
  {
    id: "stand-stand-sit",
    name: `Stand, Stand, Sit`,
    category: "classic-indian-school-games",
    body: `The classic. Mask calls commands rapid-fire — "stand, stand, sit, stand, sit, sit, stand!" Anyone who messes up sits out. Last student standing wins. **Blockchain twist**: Mask calls them as "Bull, Bull, Bear" instead. Bull = stand, Bear = sit. Teaches market direction terminology while playing the game.

Mask script: "Okay everyone stand up. Bull means stand. Bear means sit. Don't get fooled. Here we go — Bull. Bull. Bear. Bull. Bear. Bear. Bull! Three of you out. Don't be sad, you're already better at this than 90% of CT."`,
  },
  {
    id: "simon-says",
    name: `Simon Says — Crypto Edition`,
    category: "classic-indian-school-games",
    body: `Mask says "Mask says do X" — students do it. If Mask says "do X" without "Mask says," anyone who does it is out. **Twist**: actions are crypto-themed. "Mask says HODL" (close fist), "Mask says diamond hands" (raise both fists), "Mask says rug pull" (pull hands away), "Mask says stake" (cross arms).`,
  },
  {
    id: "pass-the-parcel",
    name: `Pass the Parcel — Hot Potato Quiz`,
    category: "classic-indian-school-games",
    body: `Imaginary "hot wallet" gets passed around the room while Mask plays a beat. Mask shouts "STOP." Whoever's holding the wallet has to answer a question. Wrong answer? They're "rugged" and out. Right answer? They earn a point and pass it on.`,
  },
  {
    id: "antakshari",
    name: `Antakshari — Crypto Edition`,
    category: "classic-indian-school-games",
    body: `Like the song game but with crypto terms. Mask starts with a word — "Bitcoin." Next student must say a crypto word starting with the last letter — N. They say "NFT." Next person — T. "Token." And so on. Speed it up. Last person standing wins.`,
  },
  {
    id: "chinese-whispers",
    name: `Chinese Whispers — Tokenomics Edition`,
    category: "classic-indian-school-games",
    body: `Mask whispers a complex concept (e.g., "deflationary tokenomics with quadratic burn") to the first student. They whisper to the next. By the time it reaches the last person, what's the message? Hilarious AND teaches why clear communication matters in technical fields.`,
  },
  {
    id: "dumb-charades",
    name: `Dumb Charades — Blockchain Concepts`,
    category: "classic-indian-school-games",
    body: `Mask gives a student a blockchain term to act out (no speaking). The class guesses. Examples: "Mining," "Whale," "Diamond hands," "Liquidity pool," "Smart contract," "Pump and dump."`,
  },
  {
    id: "last-person-standing",
    name: `Last Person Standing — Speed Quiz`,
    category: "classic-indian-school-games",
    body: `Everyone stands. Mask asks rapid-fire questions. Wrong answer or hesitation = sit down. Last person standing wins. Mask keeps it tight: "Bitcoin's max supply? You — 21 million, correct, stay standing. You — 100 million, wrong, sit. You — 21 thousand, sit, my brother."`,
  },
  {
    id: "cluster",
    name: `1-2-3 Cluster`,
    category: "classic-indian-school-games",
    headingSuffix: ` (rebranded)`,
    body: `Mask shouts a number. Students must form clusters of that size as fast as possible. Anyone not in a cluster is out. **Twist**: Mask calls "block size" — "Block size 4!" Students cluster in 4s. Teaches block validation in a stupid fun way.`,
  },
  // Crypto-native activities — 8
  {
    id: "two-truths",
    name: `Two Truths and a Coin`,
    category: "crypto-native",
    body: `Mask states 3 facts. Two true, one lie. Students vote which is the lie.`,
  },
  {
    id: "translate-ct-tweet",
    name: `Translate this CT tweet`,
    category: "crypto-native",
    body: `Mask reads a real Crypto Twitter post. Students translate jargon to normal speech.`,
  },
  {
    id: "roast-the-chart",
    name: `Roast the chart`,
    category: "crypto-native",
    body: `Mask shows a token chart. Students explain what's happening.`,
  },
  {
    id: "steal-my-idea",
    name: `Steal my idea`,
    category: "crypto-native",
    body: `Mask describes a fake startup. Students decide: scam or legit?`,
  },
  {
    id: "speed-round",
    name: `Speed round`,
    category: "crypto-native",
    body: `60 seconds, 10 questions, room shouts answers.`,
  },
  {
    id: "eli5",
    name: `Explain it like I'm 5`,
    category: "crypto-native",
    body: `Student picks a concept. Mask explains it three ways: 5-year-old, college student, finance professor.`,
  },
  {
    id: "find-the-scam",
    name: `Find the scam`,
    category: "crypto-native",
    body: `Mask describes 3 crypto offerings. Students vote which is the scam. Directly serves the dean's mandate to keep students from getting scammed.`,
  },
  {
    id: "build-a-token",
    name: `Build a token`,
    category: "crypto-native",
    body: `Group activity. Students propose a token for their college. Mask grills them on supply, value, gaming risk.`,
  },
];
