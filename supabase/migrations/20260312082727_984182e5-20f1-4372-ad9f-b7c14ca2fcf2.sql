
-- Fix credits_eur values: should represent credit amount, not price
UPDATE ai_credit_packages SET credits_eur = 100 WHERE name = 'Starter';
UPDATE ai_credit_packages SET credits_eur = 500 WHERE name = 'Professional';
UPDATE ai_credit_packages SET credits_eur = 2000 WHERE name = 'Business';
UPDATE ai_credit_packages SET credits_eur = 10000 WHERE name = 'Enterprise';
