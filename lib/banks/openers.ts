// lib/banks/openers.ts
import type { Opener } from "./types";

export const OPENER_BANK: Opener[] = [
  // Joke openers (3)
  { id: "opener-joke-1", category: "joke", body: `Why did the Bitcoin developer break up with his girlfriend? She had too many private keys.` },
  { id: "opener-joke-2", category: "joke", body: `I asked ChatGPT if it could explain blockchain. It said its training data ends in 2023. Bro, same energy.` },
  { id: "opener-joke-3", category: "joke", body: `What's the difference between Ethereum and Indian Railways? One has scheduled upgrades that actually work.` },
  // Activity openers (2)
  { id: "opener-activity-1", category: "activity", body: `Quick 30-second thing. Stand up. If you've ever lost money in a UPI scam, sit down. Damn. Half of you. Today's session is for you.` },
  { id: "opener-activity-2", category: "activity", body: `Everyone close your eyes. Imagine your bank disappeared overnight. Money is still there but the bank is gone. How do you prove it's yours? That's today's session.` },
  // Hook openers (3)
  { id: "opener-hook-1", category: "hook", body: `Today I'll tell you about a man who paid 80 crore rupees for two pizzas. Not figuratively. By end of class you'll know why this is the most important meal in financial history.` },
  { id: "opener-hook-2", category: "hook", body: `There's a guy who lost the password to a hard drive worth 1,800 crore. He wants to dig it out of a landfill. The city says no. Today's session is about why that hard drive matters.` },
  { id: "opener-hook-3", category: "hook", body: `A 19-year-old wrote a 36-page document in 2013. That document is now worth 50 lakh crore rupees. Let's talk about what he wrote.` },
  // Roast openers (2)
  { id: "opener-roast-1", category: "roast", body: `So Baz walked in late again. While we wait, let me tell you about decentralization — a system designed to keep working even when one node fails.` },
  { id: "opener-roast-2", category: "roast", body: `Baz wants me to tell you he's been working on this session all week. I have his chat history, this is not technically true.` },
  // Vibe openers (2)
  { id: "opener-vibe-1", category: "vibe", body: `Okay good morning, good morning. I can already tell who skipped breakfast and who skipped sleep. Both of you, drink water.` },
  { id: "opener-vibe-2", category: "vibe", body: `Friday session. Half of you are mentally already at the weekend. I respect it. Let's make this fast and useful.` },
  // Self-aware openers (2)
  { id: "opener-self-aware-1", category: "self-aware", body: `I'm an AI. Baz built me to make these sessions less boring. So far it's working. Let's not waste it.` },
  { id: "opener-self-aware-2", category: "self-aware", body: `Some of you still find it weird that you're being co-taught by an AI. By end of semester you'll find it weird when there isn't one.` },
];
