import os
import shutil

skills_dir = r"d:\Users\aboul\Desktop\ACD\.agents\skills"
categories = [
    "product", "ux", "ui-design-system", "frontend", "backend", "database", 
    "auth-permissions", "security", "payments", "integrations", "files-media", 
    "notifications", "admin-tools", "testing-qa", "performance", "accessibility", 
    "devops", "observability", "documentation", "git-workflow"
]

# Create directories and README.md
for cat in categories:
    cat_dir = os.path.join(skills_dir, cat)
    os.makedirs(cat_dir, exist_ok=True)
    readme_path = os.path.join(cat_dir, "README.md")
    if not os.path.exists(readme_path):
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(f"# {cat}\n\n## Propósito\nAgrupación lógica de skills para la categoría {cat}.\n\n## Skills instaladas o referenciadas\nVer manifest global para los defaults.")

# Move installed skills
moves = {
    "to-prd": "product",
    "to-issues": "product",
    "brandkit": "ui-design-system",
    "design-taste-frontend": "ui-design-system",
    "design-taste-frontend-v1": "ui-design-system",
    "gpt-taste": "ui-design-system",
    "high-end-visual-design": "ui-design-system",
    "image-to-code": "ui-design-system",
    "imagegen-frontend-mobile": "ui-design-system",
    "imagegen-frontend-web": "ui-design-system",
    "industrial-brutalist-ui": "ui-design-system",
    "minimalist-ui": "ui-design-system",
    "redesign-existing-projects": "ui-design-system",
    "stitch-design-taste": "ui-design-system",
    "full-output-enforcement": "git-workflow"
}

for skill_folder, target_cat in moves.items():
    src = os.path.join(skills_dir, skill_folder)
    dst = os.path.join(skills_dir, target_cat, skill_folder)
    if os.path.exists(src) and not os.path.exists(dst):
        shutil.move(src, dst)
        print(f"Moved {skill_folder} to {target_cat}")

print("Done reorganizing.")
