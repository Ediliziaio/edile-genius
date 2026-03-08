INSERT INTO render_credits (company_id, balance, total_purchased, total_used)
VALUES ('f9361dd6-2499-4a70-afc6-43d69438bda8', 5, 5, 0)
ON CONFLICT (company_id) DO NOTHING;