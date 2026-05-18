// lib/visualCommands.ts
//
// Pure functions for stage-command parsing and asset matching.
// Consumed by VoiceLoop.tsx in Phase 3.3.3, which calls
// parseStageTags() on each streamed chat sentence before passing
// the stripped text to TTS, then resolves any emitted StageEvent
// against the live asset list via matchAssetByQuery().
//
// No DB access, no React hooks, no network. Pure input → output.

import type { Asset, StageEvent } from '@/lib/types';

const STAGE_TAG_REGEX = /<stage>(\{[\s\S]*?\})<\/stage>/g;

/**
 * Extract and strip <stage>...</stage> tags from chat-stream text.
 *
 * Each tag body is JSON-parsed and validated against the StageEvent
 * shape. Malformed tags (parse error or shape mismatch) are stripped
 * from the text but produce no event — a console.warn surfaces the
 * failure for debugging. Stripping the tag in all cases ensures TTS
 * never speaks literal "<stage>...</stage>" characters aloud.
 *
 * Validation rules:
 *   - body must JSON.parse to a non-null plain object
 *   - body.action must equal 'show' or 'hide'
 *   - if action === 'show', body.query must be a non-empty string
 *   - if action === 'hide', query is ignored (may be present or absent)
 *   - unknown fields are ignored (forward-compat for future verbs)
 *
 * @param text  Raw chat-stream text, possibly containing 0+ stage tags
 * @returns     strippedText with all tag substrings removed, plus the
 *              ordered list of valid StageEvent objects parsed from
 *              the tag bodies (in source order)
 */
export function parseStageTags(text: string): {
  strippedText: string;
  events: StageEvent[];
} {
  const events: StageEvent[] = [];

  for (const match of text.matchAll(STAGE_TAG_REGEX)) {
    const body = match[1];
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch (err) {
      console.warn(
        '[parseStageTags] failed to parse stage tag body as JSON:',
        body,
        err,
      );
      continue;
    }

    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      console.warn(
        '[parseStageTags] stage tag body did not match StageEvent shape:',
        parsed,
      );
      continue;
    }

    const obj = parsed as Record<string, unknown>;
    const action = obj.action;

    if (action === 'show') {
      const query = obj.query;
      if (typeof query !== 'string' || query.length === 0) {
        console.warn(
          '[parseStageTags] stage tag body did not match StageEvent shape:',
          parsed,
        );
        continue;
      }
      events.push({ action: 'show', query });
    } else if (action === 'hide') {
      events.push({ action: 'hide' });
    } else {
      console.warn(
        '[parseStageTags] stage tag body did not match StageEvent shape:',
        parsed,
      );
      continue;
    }
  }

  const strippedText = text.replace(STAGE_TAG_REGEX, '');
  return { strippedText, events };
}

/**
 * Score-based fuzzy match from a query string to the best Asset.
 *
 * Both query and tags are lowercased and tokenized. Tag tokens are
 * additionally split on hyphens so a tag like 'pizza-day' contributes
 * both 'pizza' and 'day' to the asset's matchable token set. An
 * asset's score is the count of distinct query tokens that appear
 * in its token set (set-intersection size, not multiset overlap).
 *
 * @param query   Free-text query, e.g. "pizza day bitcoin"
 * @param assets  Candidate assets (typically the full library)
 * @returns       The highest-scoring asset, or null when there is
 *                no usable match (empty query, empty asset list, or
 *                no overlap). Ties resolve to the first asset in
 *                input order — stable and predictable.
 */
export function matchAssetByQuery(
  query: string,
  assets: Asset[],
): Asset | null {
  const queryTokens = new Set(
    query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0),
  );

  if (queryTokens.size === 0 || assets.length === 0) return null;

  let bestAsset: Asset | null = null;
  let bestScore = 0;

  for (const asset of assets) {
    const assetTokens = new Set<string>();
    for (const tag of asset.tags) {
      for (const sub of tag.toLowerCase().split(/[-\s]+/)) {
        if (sub.length > 0) assetTokens.add(sub);
      }
    }

    let score = 0;
    for (const qt of queryTokens) {
      if (assetTokens.has(qt)) score++;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAsset = asset;
    }
  }

  if (bestScore === 0) return null;
  return bestAsset;
}
