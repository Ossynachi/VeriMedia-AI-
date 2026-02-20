export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function calculateAnomalyScore(currentEmbedding: number[], historyEmbeddings: number[][]): number {
  if (historyEmbeddings.length === 0) return 0; // No history, no anomaly

  // Calculate similarity to all history items
  const similarities = historyEmbeddings.map(emb => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < currentEmbedding.length; i++) {
      dotProduct += currentEmbedding[i] * emb[i];
      normA += currentEmbedding[i] * currentEmbedding[i];
      normB += emb[i] * emb[i];
    }
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return similarity;
  });
  
  // Sort descending (most similar first)
  similarities.sort((a, b) => b - a);
  
  // Take top 5 (or fewer)
  const k = Math.min(5, similarities.length);
  const topK = similarities.slice(0, k);
  const avgSimilarity = topK.reduce((a, b) => a + b, 0) / k;
  
  // Similarity is -1 to 1. We expect embeddings to be 0 to 1 usually for text.
  // Anomaly score: 100 * (1 - similarity)
  // If similarity is 1.0, anomaly is 0.
  // If similarity is 0.5, anomaly is 50.
  
  return Math.max(0, Math.min(100, (1 - avgSimilarity) * 100));
}
