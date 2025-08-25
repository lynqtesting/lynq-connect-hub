-- Link existing tweakable questions to the Pro-Fit Simplified module (which admin has assigned)
UPDATE public.tweakable_questions 
SET module_id = '03cfa0b0-adda-4610-8e40-19fec0cd924f'
WHERE module_id IS NULL;

-- Add some sample adaptive ideas for the Pro-Fit Simplified module
INSERT INTO public.adaptive_ideas (module_id, title, description) VALUES
('03cfa0b0-adda-4610-8e40-19fec0cd924f', 'Overcoming Price Objections & Value Positioning', 'Cost comparison calculators: ULIP + separate mediclaim vs Pro-Fit total cost over 10-20 years → ROI demonstration tools: Interactive scenarios showing wealth creation alongside health protection → Premium justification framework: "Cost per day" breakdown showing daily investment vs coffee/entertainment costs'),
('03cfa0b0-adda-4610-8e40-19fec0cd924f', 'Simplifying Complex Concepts', 'One-minute elevator pitch templates for different customer personas → Visual storytelling tools: Infographics and simple diagrams for health fund mechanics → Customer journey mapping: When and how withdrawals work with real-life scenarios'),
('03cfa0b0-adda-4610-8e40-19fec0cd924f', 'Advanced Tax Benefits Explanation', 'Tax savings calculator with real scenarios → Benefits comparison chart vs traditional investment options → Step-by-step guide for claiming tax deductions under Section 80C and 80D');