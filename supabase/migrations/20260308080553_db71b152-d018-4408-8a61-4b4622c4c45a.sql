INSERT INTO ai_credits (company_id, balance_eur, total_recharged_eur, total_spent_eur)
VALUES ('f9361dd6-2499-4a70-afc6-43d69438bda8', 1000, 1000, 0)
ON CONFLICT (company_id) DO UPDATE SET balance_eur = 1000, total_recharged_eur = 1000;