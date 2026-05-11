// lib/banks/stories.ts
import type { Story } from "./types";

export const STORY_BANK: Story[] = [
  { id: "pizza-day", name: `The pizza story (Bitcoin Pizza Day)`, body: `May 22, 2010. Laszlo Hanyecz. 10,000 BTC for two Papa John's. Today: ~80 crore rupees. The first real-world Bitcoin transaction.` },
  { id: "mt-gox", name: `The Mt. Gox collapse`, body: `Started as a Magic: The Gathering trading card site. Became 70% of all Bitcoin trading. February 2014: 850,000 BTC gone. Birthplace of "not your keys, not your coins."` },
  { id: "vitalik-origin", name: `The Vitalik origin`, body: `19-year-old writes 36-page Ethereum whitepaper in 2013. Today Ethereum is worth ~50 lakh crore rupees. A teenager wrote that.` },
  { id: "sbf-ftx", name: `The SBF / FTX fall`, body: `$32 billion company to zero in 9 days. Charisma is not collateral.` },
  { id: "dao-hack", name: `The DAO hack`, body: `2016. $150M drained via smart contract bug. Ethereum had to fork to recover. Birth of Ethereum Classic.` },
  { id: "genesis-block", name: `The Genesis Block`, body: `January 3, 2009. Embedded message: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks." Will be there in 1000 years.` },
  { id: "tornado-cash", name: `Tornado Cash`, body: `Developer Alexey Pertsev arrested for writing open-source code. Crypto still arguing about whether code is speech.` },
  { id: "silk-road", name: `Silk Road / Ross Ulbricht`, body: `Anonymous dark web marketplace. Founder caught in a SF library, laptop open. Two life sentences. Pardoned in 2025 after 11 years.` },
  { id: "luna-terra", name: `Luna / Terra collapse`, body: `$40 billion vanished in days. Algorithmic stablecoin failure. Several lives lost. Do Kwon caught and extradited.` },
];
