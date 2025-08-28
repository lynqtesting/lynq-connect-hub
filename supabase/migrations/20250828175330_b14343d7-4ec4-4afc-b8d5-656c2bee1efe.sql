-- Phase 2: Clean up existing category data
-- Convert all uppercase categories to title case format
UPDATE public.modules 
SET category = CASE 
  WHEN category = 'PRODUCT' THEN 'Product'
  WHEN category = 'COMPLIANCE' THEN 'Compliance'
  WHEN category = 'SOFT_SKILLS' THEN 'Soft Skills'
  WHEN category = 'CUSTOMER_AWARENESS' THEN 'Customer Awareness'
  ELSE category
END
WHERE category IN ('PRODUCT', 'COMPLIANCE', 'SOFT_SKILLS', 'CUSTOMER_AWARENESS');