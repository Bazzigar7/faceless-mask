import { supabaseAdmin } from './supabaseAdmin';

export type CreateAssetInput = {
  type: 'image' | 'video';
  storage_path: string;
  url: string;
  tags: string[];
  exact_phrases: string[];
  alt_text: string | null;
  description: string | null;
};

export async function createAsset(input: CreateAssetInput): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('assets')
    .insert({
      type: input.type,
      storage_path: input.storage_path,
      url: input.url,
      tags: input.tags,
      exact_phrases: input.exact_phrases,
      alt_text: input.alt_text,
      description: input.description,
      added_by: 'baz',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createAsset] Insert failed:', error);
    throw error;
  }
  if (!data) {
    throw new Error('createAsset: insert returned no row');
  }

  return data.id;
}
