UPDATE pricing_rules SET active = FALSE WHERE productKey IN ('sofa', 'poltrona', 'cadeira', 'banqueta', 'colchao');

INSERT INTO pricing_rules (productKey, productName, description, sortOrder, places, itemType, fabric, washPrice, waterproofPrice, active)
VALUES
('sofa', 'Sofá', 'Retrátil/Fixo — por lugar (Suede/Linho/Veludo)', 10, 'por lugar', 'retrátil/fixo', 'suede/linho/veludo', 150.00, 150.00, TRUE),
('poltrona', 'Poltrona', 'Padrão — 1 lugar (Suede/Linho/Veludo)', 20, '1 lugar', 'padrão', 'suede/linho/veludo', 80.00, 80.00, TRUE),
('cadeira', 'Cadeira', 'Jantar/Escritório — assento e encosto', 30, '1 lugar', 'jantar/escritório', 'assento e encosto', 30.00, 30.00, TRUE),
('banqueta', 'Banqueta', 'Padrão — assento', 40, '1 lugar', 'padrão', 'assento', 20.00, 20.00, TRUE),
('colchao', 'Colchão', 'Solteiro/Casal/King — padrão', 50, 'padrão', 'solteiro/casal/king', 'padrão', 200.00, 200.00, TRUE),
('sofa', 'Sofá', 'Preço específico da planilha', 10, '2 lugares', 'retrátil', 'suede', 200.00, 200.00, TRUE),
('sofa', 'Sofá', 'Preço específico da planilha', 10, '3 lugares', 'fixo', 'linho', 350.00, 350.00, TRUE),
('sofa', 'Sofá', 'Preço específico da planilha', 10, '5 lugares', 'canto', 'suede', 500.00, 500.00, TRUE),
('sofa', 'Sofá', 'Preço específico da planilha', 10, '2 lugares', 'fixo', 'linho', 200.00, 200.00, TRUE),
('sofa', 'Sofá', 'Preço específico da planilha', 10, '3 lugares', 'fixo', 'suede', 300.00, 300.00, TRUE),
('sofa', 'Sofá', 'Preço específico da planilha', 10, '4 lugares', 'retrátil', 'veludo', 450.00, 450.00, TRUE),
('poltrona', 'Poltrona', 'Preço específico da planilha', 20, '1 lugar', 'padrão', 'veludo', 120.00, 120.00, TRUE),
('poltrona', 'Poltrona', 'Preço específico da planilha', 20, '1 lugar', 'fixo', 'linho', 120.00, 120.00, TRUE),
('cadeira', 'Cadeira', 'Preço específico da planilha', 30, '1 lugar', 'jantar', 'tecido padrão', 40.00, 40.00, TRUE)
ON DUPLICATE KEY UPDATE
  productName = VALUES(productName),
  description = VALUES(description),
  sortOrder = VALUES(sortOrder),
  washPrice = VALUES(washPrice),
  waterproofPrice = VALUES(waterproofPrice),
  active = TRUE;
