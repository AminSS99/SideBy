import os
import glob

e2e_files = glob.glob('frontend/e2e/*.spec.ts')

for file in e2e_files:
    with open(file, 'r') as f:
        content = f.read()

    content = content.replace(
        '"Product or framework A (e.g. Supabase)"',
        '"e.g. Supabase"'
    )
    content = content.replace(
        '"Product or framework B (e.g. Firebase)"',
        '"e.g. Firebase"'
    )

    with open(file, 'w') as f:
        f.write(content)
