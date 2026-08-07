"""
Ingestion DECP → Supabase (table decp_attributions) — version automatisée.

Tourne chaque semaine via GitHub Actions (.github/workflows/ingest-decp.yml).
La clé service role est lue depuis la variable d'environnement SUPABASE_SERVICE_KEY.

Intègre tous les correctifs validés le 6 août 2026 :
- URL de la ressource Parquet (fichier de données, pas le schéma)
- Dates converties en ISO, dates aberrantes (<2000 ou >2030) mises à NULL
- duree_mois converti en entier
- Chaînes vides → NULL
"""

import os
import datetime
import urllib.request
import pandas as pd
from supabase import create_client

DECP_PARQUET_URL = "https://www.data.gouv.fr/api/1/datasets/r/11cea8e8-df3e-4ed1-932b-781e2635e432"
SUPABASE_URL = "https://focftfqgbwnxbwvkpzbm.supabase.co"
CPV_PREFIX = "45"   # Travaux BTP
BATCH_SIZE = 500
LOCAL_FILE = "decp.parquet"

COLMAP = {
    "uid": "uid",
    "modification_id": "modification_id",
    "acheteur_id": "acheteur_siret",
    "acheteur_nom": "acheteur_nom",
    "objet": "objet",
    "codeCPV": "code_cpv",
    "procedure": "procedure",
    "nature": "nature",
    "dateNotification": "date_notification",
    "dureeMois": "duree_mois",
    "montant": "montant",
    "titulaire_id": "titulaire_id",
    "titulaire_nom": "titulaire_nom",
    "lieuExecution_code": "lieu_execution_code",
}

DATE_MIN = datetime.date(2000, 1, 1)
DATE_MAX = datetime.date(2030, 1, 1)


def clean_value(v):
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass
    if isinstance(v, (pd.Timestamp, datetime.datetime)):
        v = v.date()
    if isinstance(v, datetime.date):
        if v < DATE_MIN or v > DATE_MAX:
            return None
        return v.isoformat()
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


def main():
    key = os.environ["SUPABASE_SERVICE_KEY"]
    supabase = create_client(SUPABASE_URL, key)

    print("Téléchargement du Parquet DECP…")
    urllib.request.urlretrieve(DECP_PARQUET_URL, LOCAL_FILE)
    size_mb = os.path.getsize(LOCAL_FILE) / 1e6
    print(f"Fichier téléchargé : {size_mb:.0f} Mo")
    if size_mb < 50:
        raise RuntimeError(
            "Fichier trop petit — l'URL ne renvoie probablement plus le Parquet. Ingestion annulée."
        )

    df = pd.read_parquet(LOCAL_FILE)
    print(f"{len(df)} lignes au total")

    df = df[df["codeCPV"].astype(str).str.startswith(CPV_PREFIX)]
    print(f"{len(df)} lignes après filtre CPV {CPV_PREFIX}xxxxxx (BTP)")

    cols = [c for c in COLMAP if c in df.columns]
    missing = set(COLMAP) - set(cols)
    if missing:
        print(f"⚠️ Colonnes absentes de la source : {missing}")
    df = df[cols].rename(columns={c: COLMAP[c] for c in cols})

    df["modification_id"] = (
        pd.to_numeric(df.get("modification_id"), errors="coerce").fillna(0).astype(int)
    )
    if "titulaire_id" in df.columns:
        df["titulaire_id"] = df["titulaire_id"].fillna("")
    else:
        df["titulaire_id"] = ""
    if "duree_mois" in df.columns:
        df["duree_mois"] = pd.to_numeric(df["duree_mois"], errors="coerce").astype("Int64")
    df = df.dropna(subset=["uid", "acheteur_siret"])
    df = df.drop_duplicates(subset=["uid", "modification_id", "titulaire_id"])

    records = [
        {k: clean_value(v) for k, v in row.items()}
        for row in df.to_dict(orient="records")
    ]

    # titulaire_id est partie de la clé primaire — ne peut pas être None
    for r in records:
        if r.get("titulaire_id") is None:
            r["titulaire_id"] = ""

    print(f"Upsert de {len(records)} lignes vers Supabase…")
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        supabase.table("decp_attributions").upsert(
            batch, on_conflict="uid,modification_id,titulaire_id"
        ).execute()
        if (i // BATCH_SIZE) % 100 == 0:
            print(f"  {min(i + BATCH_SIZE, len(records))}/{len(records)}")

    print("✅ Ingestion terminée")


if __name__ == "__main__":
    main()
