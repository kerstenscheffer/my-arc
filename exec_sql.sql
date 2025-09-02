-- Eenvoudige SQL executor voor call_requests
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Alleen INSERT voor call_requests toegestaan
  IF query ILIKE '%INSERT INTO call_requests%' AND 
     NOT query ILIKE '%DELETE%' AND 
     NOT query ILIKE '%UPDATE%' AND
     NOT query ILIKE '%DROP%' THEN
    EXECUTE query;
  END IF;
  
  EXCEPTION
    WHEN OTHERS THEN
      -- Geen errors naar client
      RETURN;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION exec_sql TO anon, authenticated;
