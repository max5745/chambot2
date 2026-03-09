-- 🚀 MIGRATION: Upgrade Embedding Model to intfloat/multilingual-e5-base (768-dim)
-- ---------------------------------------------------------------------------
-- 1. Drop the HNSW index
DROP INDEX IF EXISTS public.idx_product_embeddings_hnsw;

-- 2. Alter the embedding column to vector(768)
-- This will wipe existing embeddings (they must be null or castable, but here we just need to change type)
-- We use USING clause to ensure clean transition, though data will need re-indexing.
ALTER TABLE public.product_embeddings 
ALTER COLUMN embedding TYPE vector(768);

-- 3. Update the search function
CREATE OR REPLACE FUNCTION search_products_by_embedding(
    query_embedding vector(768),
    match_count     INT DEFAULT 10
)
RETURNS TABLE (
    product_id  INT,
    similarity  FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        pe.product_id,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM public.product_embeddings pe
    JOIN public.products p ON p.product_id = pe.product_id
    WHERE p.is_active = true
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- 4. Recreate the HNSW index for 768-dim
CREATE INDEX IF NOT EXISTS idx_product_embeddings_hnsw
    ON public.product_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 5. Clear existing (invalid) embeddings to ensure they get regenerated
TRUNCATE TABLE public.product_embeddings;

SELECT 'Migration to 768-dim completed. Please run re-indexing from the admin panel.' AS status;
