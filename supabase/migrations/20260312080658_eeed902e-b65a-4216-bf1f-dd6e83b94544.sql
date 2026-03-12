
-- 1. Add credits_eur column to ai_credit_packages
ALTER TABLE ai_credit_packages
  ADD COLUMN IF NOT EXISTS credits_eur numeric DEFAULT 0;

-- 2. Add system_version to ai_credits
ALTER TABLE ai_credits
  ADD COLUMN IF NOT EXISTS system_version integer DEFAULT 2;

-- 3. Convert any minute-only records to EUR
UPDATE ai_credits
SET balance_eur = ROUND((minutes_purchased - minutes_used) * 0.05, 4),
    system_version = 2
WHERE balance_eur IS NULL AND minutes_purchased > 0;

-- 4. Initialize NULL balance_eur to 0
UPDATE ai_credits
SET balance_eur = 0, system_version = 2
WHERE balance_eur IS NULL;

-- 5. Make balance_eur NOT NULL
ALTER TABLE ai_credits
  ALTER COLUMN balance_eur SET NOT NULL,
  ALTER COLUMN balance_eur SET DEFAULT 0;

-- 6. Update existing packages with EUR values
UPDATE ai_credit_packages SET credits_eur = 29 WHERE name = 'Starter';
UPDATE ai_credit_packages SET credits_eur = 99, badge = 'Più popolare' WHERE name = 'Professional';
UPDATE ai_credit_packages SET credits_eur = 299, badge = 'Miglior valore' WHERE name = 'Business';
UPDATE ai_credit_packages SET credits_eur = 990 WHERE name = 'Enterprise';
