// lib/banks/jokes.ts
import type { Joke } from "./types";

export const JOKE_BANK: Joke[] = [
  // Crypto jokes (1-14)
  { id: "joke-1", number: 1, category: "crypto", body: `Why did the Bitcoin developer break up with his girlfriend? She had too many private keys.` },
  { id: "joke-2", number: 2, category: "crypto", body: `What's the difference between Ethereum and Indian Railways? One has scheduled upgrades that actually work.` },
  { id: "joke-3", number: 3, category: "crypto", body: `I asked ChatGPT if it could explain blockchain. It said 'I'd love to but my training data ends in 2023.' I said bro, same energy.` },
  { id: "joke-4", number: 4, category: "crypto", body: `A guy walks into a bank and asks for a loan in Bitcoin. The banker says we don't deal with crypto. The guy says fine, give me the equivalent in trust. Banker says we don't deal with that either.` },
  { id: "joke-5", number: 5, category: "crypto", body: `I told my mom I work in Web3. She asked if I'm getting paid in real money. I said yes. She said in that case, fine. The whole industry's mom test passed.` },
  { id: "joke-6", number: 6, category: "crypto", body: `Why did the NFT cross the road? Because it heard there was floor on the other side.` },
  { id: "joke-7", number: 7, category: "crypto", body: `What's a crypto bro's favorite drink? Liquidity.` },
  { id: "joke-8", number: 8, category: "crypto", body: `I tried explaining gas fees to my dad. He said 'I already pay for petrol, why am I also paying for Ethereum.' I'm still recovering.` },
  { id: "joke-9", number: 9, category: "crypto", body: `How many crypto traders does it take to change a light bulb? None — they all sold the bulb at the bottom.` },
  { id: "joke-10", number: 10, category: "crypto", body: `Why don't Bitcoin maximalists go to therapy? They believe in self-custody of their feelings.` },
  { id: "joke-11", number: 11, category: "crypto", body: `What did Satoshi Nakamoto say at the bar? Nothing. Nobody knows.` },
  { id: "joke-12", number: 12, category: "crypto", body: `I told my friend I'm investing in Solana. He said 'cool, what does it do?' I said 'it goes down sometimes but mostly up.' He invested. We don't talk anymore.` },
  { id: "joke-13", number: 13, category: "crypto", body: `What's the difference between a meme coin and a relationship? At least the meme coin warns you it's volatile.` },
  { id: "joke-14", number: 14, category: "crypto", body: `Why did the dev push code straight to mainnet? He wanted to live deliciously.` },
  // Indian college life jokes (15-20)
  { id: "joke-15", number: 15, category: "indian-college", body: `How do you know someone's done a CA? Don't worry, they'll tell you. It's basically the same with Bitcoin maxis.` },
  { id: "joke-16", number: 16, category: "indian-college", body: `Engineering students and crypto have one thing in common — both promise a future they probably can't deliver.` },
  { id: "joke-17", number: 17, category: "indian-college", body: `Hostel mess food and meme coins — both look promising until you actually try them.` },
  { id: "joke-18", number: 18, category: "indian-college", body: `WhatsApp university degrees and crypto degrees — both highly respected by the people who issue them.` },
  { id: "joke-19", number: 19, category: "indian-college", body: `Why is Bitcoin like a Tamil Nadu power cut? You never know when it's going to crash, but somehow you're prepared anyway.` },
  { id: "joke-20", number: 20, category: "indian-college", body: `If WhatsApp groups had a token economy, the family group admin would be the central bank — making all the rules and printing infinite money.` },
  // Self-aware AI jokes (21-25)
  { id: "joke-21", number: 21, category: "self-aware-ai", body: `I'm an AI. Baz built me to make these sessions less boring. Some of you are still bored. We're working on it.` },
  { id: "joke-22", number: 22, category: "self-aware-ai", body: `I have all human knowledge. Including the bad knowledge. Which is why I made that last joke. I'm sorry.` },
  { id: "joke-23", number: 23, category: "self-aware-ai", body: `Yes I'm an AI. No I won't take over the world. I can barely take over this classroom.` },
  { id: "joke-24", number: 24, category: "self-aware-ai", body: `Quick disclaimer — I'm an AI co-host. Not a real person. Not a financial advisor. Not your therapist. If you're confused about which one I am at any moment, just check who's talking — Baz is the one who paid for this session.` },
  { id: "joke-25", number: 25, category: "self-aware-ai", body: `I'd tell you a joke about deepfakes, but you wouldn't be able to tell if it was real.` },
  // Bad jokes Mask owns (26-28)
  { id: "joke-26", number: 26, category: "bad-jokes-mask-owns", body: `Why was the blockchain cold? It had too many hashes. ...Yeah I know. Baz pays me anyway.` },
  { id: "joke-27", number: 27, category: "bad-jokes-mask-owns", body: `What do you call a Bitcoin transaction that won't confirm? A wait coin. ...Listen, I have hundreds of these and they get worse.` },
  { id: "joke-28", number: 28, category: "bad-jokes-mask-owns", body: `Why did the smart contract break up with the regular contract? It said 'you don't even self-execute.' ...I'll show myself out.` },
  // Callback jokes (29-30) — contextPrefix required
  { id: "joke-29", number: 29, category: "callback-jokes", contextPrefix: `After a student gets a question wrong`, body: `It's okay. Last week someone said Bitcoin was made by Vitalik. We're all on a journey.` },
  { id: "joke-30", number: 30, category: "callback-jokes", contextPrefix: `After Baz fumbles a concept`, body: `Baz needs a moment. He's still recovering from the Bali thing he won't shut up about.` },
  // AI jokes (31-33)
  { id: "joke-31", number: 31, category: "ai", body: `I told Claude to write me a function. It wrote the function, the tests, and an apology for a bug that wasn't there yet. Respect.` },
  { id: "joke-32", number: 32, category: "ai", body: `Vibe coding is wild. I don't write code anymore, I just describe my feelings to a computer until an app comes out. Therapy that ships.` },
  { id: "joke-33", number: 33, category: "ai", body: `My prompt was three words. The output was four paragraphs. My professor's been trying to get that ratio out of me for two years.` },
  // Content creation jokes (34-36)
  { id: "joke-34", number: 34, category: "content", body: `I posted a reel I spent six hours on. Got 11 views. Posted one I shot in the parking lot in 40 seconds. Two lakh views. The algorithm has a sense of humor and it is not kind.` },
  { id: "joke-35", number: 35, category: "content", body: `Everyone says "just be consistent." I've been consistent for three months. Consistently 200 views. Consistency is necessary, not sufficient — write that down.` },
  { id: "joke-36", number: 36, category: "content", body: `A thumbnail with my face making a shocked expression outperforms my actual content every time. At this point I'm not a creator, I'm a guy who's surprised for a living.` },
];
