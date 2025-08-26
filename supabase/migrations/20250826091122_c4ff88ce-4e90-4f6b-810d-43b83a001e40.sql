-- Remove legacy sample data from tweakable_questions
DELETE FROM public.tweakable_questions 
WHERE title IN (
  'Why are insurance premiums so high?', 
  'How can I reduce my coverage costs?', 
  'What factors affect my premium rates?',
  'Ei3y',
  'df'
);

-- Remove legacy sample data from adaptive_ideas  
DELETE FROM public.adaptive_ideas
WHERE title IN (
  'Overcoming Price Objections & Value Positioning',
  'Simplifying Complex Concepts', 
  'Advanced Tax Benefits Explanation',
  'Rtrt'
);