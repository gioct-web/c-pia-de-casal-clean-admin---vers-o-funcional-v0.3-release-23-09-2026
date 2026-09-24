from __future__ import annotations

from pathlib import Path


OUTPUT = Path("/home/ubuntu/casal-clean-admin/generated/import-pricing-rules.sql")


def esc(value: str) -> str:
    return value.replace("'", "''")


def row(product_key: str, product_name: str, description: str, order: int, places: str, item_type: str, fabric: str, price: float) -> tuple[str, ...]:
    return (product_key, product_name, description, str(order), places, item_type, fabric, f"{price:.2f}", f"{price:.2f}")


def main() -> None:
    rules: dict[tuple[str, str, str, str], tuple[str, ...]] = {}

    def add(*args: object) -> None:
        values = row(*args)
        rules[(values[0], values[4], values[5], values[6])] = values

    # Linhas agregadas expressamente publicadas na planilha: não expandir atributos ou valores.
    add("sofa", "Sofá", "Retrátil/Fixo — por lugar (Suede/Linho/Veludo)", 10, "por lugar", "retrátil/fixo", "suede/linho/veludo", 150)
    add("poltrona", "Poltrona", "Padrão — 1 lugar (Suede/Linho/Veludo)", 20, "1 lugar", "padrão", "suede/linho/veludo", 80)
    add("cadeira", "Cadeira", "Jantar/Escritório — assento e encosto", 30, "1 lugar", "jantar/escritório", "assento e encosto", 30)
    add("banqueta", "Banqueta", "Padrão — assento", 40, "1 lugar", "padrão", "assento", 20)
    add("colchao", "Colchão", "Solteiro/Casal/King — padrão", 50, "padrão", "solteiro/casal/king", "padrão", 200)

    # Combinações específicas com preço explícito nas fontes 3 e 4 da planilha.
    add("sofa", "Sofá", "Preço específico da planilha", 10, "2 lugares", "retrátil", "suede", 200)
    add("sofa", "Sofá", "Preço específico da planilha", 10, "3 lugares", "fixo", "linho", 350)
    add("sofa", "Sofá", "Preço específico da planilha", 10, "5 lugares", "canto", "suede", 500)
    add("sofa", "Sofá", "Preço específico da planilha", 10, "2 lugares", "fixo", "linho", 200)
    add("sofa", "Sofá", "Preço específico da planilha", 10, "3 lugares", "fixo", "suede", 300)
    add("sofa", "Sofá", "Preço específico da planilha", 10, "4 lugares", "retrátil", "veludo", 450)
    add("poltrona", "Poltrona", "Preço específico da planilha", 20, "1 lugar", "padrão", "veludo", 120)
    add("poltrona", "Poltrona", "Preço específico da planilha", 20, "1 lugar", "fixo", "linho", 120)
    add("cadeira", "Cadeira", "Preço específico da planilha", 30, "1 lugar", "jantar", "tecido padrão", 40)

    values = ",\n".join("(" + ", ".join(f"'{esc(value)}'" if index in (0, 1, 2, 4, 5, 6) else value for index, value in enumerate(rule)) + ", TRUE)" for rule in rules.values())
    sql = """UPDATE pricing_rules SET active = FALSE WHERE productKey IN ('sofa', 'poltrona', 'cadeira', 'banqueta', 'colchao');

INSERT INTO pricing_rules (productKey, productName, description, sortOrder, places, itemType, fabric, washPrice, waterproofPrice, active)
VALUES
""" + values + "\nON DUPLICATE KEY UPDATE\n  productName = VALUES(productName),\n  description = VALUES(description),\n  sortOrder = VALUES(sortOrder),\n  washPrice = VALUES(washPrice),\n  waterproofPrice = VALUES(waterproofPrice),\n  active = TRUE;\n"
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(sql, encoding="utf-8")
    print(f"{len(rules)} combinações geradas em {OUTPUT}")


if __name__ == "__main__":
    main()
