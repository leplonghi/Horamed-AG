import os
import re

dir_path = 'src'
# include index.html
extensions = ('.tsx', '.ts', '.jsx', '.js', '.css')

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    original = content
    content = content.replace('violet-', 'emerald-')
    content = content.replace('purple-', 'teal-')
    content = content.replace('fuchsia-', 'cyan-')
    content = content.replace('text-violet', 'text-emerald')
    content = content.replace('text-purple', 'text-teal')
    content = content.replace('bg-violet', 'bg-emerald')
    content = content.replace('bg-purple', 'bg-teal')
    content = content.replace('border-violet', 'border-emerald')
    content = content.replace('border-purple', 'border-teal')
    content = content.replace('ring-violet', 'ring-emerald')
    content = content.replace('ring-purple', 'ring-teal')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed colors in {filepath}")

for root, _, files in os.walk(dir_path):
    for file in files:
        if file.endswith(extensions):
            replace_in_file(os.path.join(root, file))

# Fix index.html
replace_in_file('index.html')
