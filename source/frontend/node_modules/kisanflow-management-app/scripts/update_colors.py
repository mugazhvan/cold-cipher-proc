import os
import re

directory = r"d:\SIH\KisanFlow-Production\source\frontend\management-app\src"

replacements = [
    (r'\bblue-', 'orange-'),
    (r'\bindigo-', 'amber-'),
    (r'\bslate-', 'zinc-')
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in replacements:
                new_content = re.sub(pattern, repl, new_content)
                
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
