import pandas as pd

df = pd.read_csv(
    "Server/Web/Shared/External Sources/ntfs_permissions_audit.csv",
    dtype=str,
    encoding="utf-8-sig",
    on_bad_lines="skip"
)

df = df.fillna("")

for col in df.columns:
    df[col] = (
        df[col]
        .str.replace("\x00", "", regex=False)
        .str.strip()
    )

df.to_csv(
    "Server/Web/Shared/External Sources/cleaned.csv",
    index=False,
    encoding="utf-8"
)