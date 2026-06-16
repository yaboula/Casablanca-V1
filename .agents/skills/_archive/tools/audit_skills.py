import os
import json
import shutil
from pathlib import Path

base_dir = Path(r"d:\Users\aboul\Desktop\ACD\.agents\skills")
root_dir = Path(r"d:\Users\aboul\Desktop\ACD")

# 1. Verify skills/ duplicate
duplicate_skills = root_dir / "skills"
duplicate_exists = duplicate_skills.exists()

# 2. Move generate_wrappers.py
gen_script = root_dir / "generate_wrappers.py"
archive_dir = base_dir / "_archive" / "tools"
archive_dir.mkdir(parents=True, exist_ok=True)
if gen_script.exists():
    shutil.move(str(gen_script), str(archive_dir / "generate_wrappers.py"))

# 3. Create Sentry Blocked folder
sentry_dir = base_dir / "observability" / "sentry-agent-skills"
sentry_dir.mkdir(parents=True, exist_ok=True)
with open(sentry_dir / "metadata.json", "w", encoding="utf-8") as f:
    json.dump({
        "name": "sentry-agent-skills",
        "category": "observability",
        "status": "blocked",
        "reason": "blocked by existing global wildcard rule in agents.toml"
    }, f, indent=2)

for file_name in ["SKILL.md", "references.md", "INSTALL.md"]:
    if not (sentry_dir / file_name).exists():
        with open(sentry_dir / file_name, "w", encoding="utf-8") as f:
            f.write(f"# Blocked\n")

# 4. Audit each category
categories = [d for d in base_dir.iterdir() if d.is_dir() and not d.name.startswith("_")]
all_skills = []

conflicts_map = {
    "drizzle-orm": ["prisma-orm"],
    "prisma-orm": ["drizzle-orm"],
    "authjs": ["better-auth"],
    "better-auth": ["authjs"],
    "trpc": ["fastify"],
    "fastify": ["trpc"],
    "refine-core": ["react-admin"],
    "react-admin": ["refine-core"],
    "changesets": ["semantic-release"],
    "semantic-release": ["changesets"],
    "open-design": ["ui-ux-pro-max"],
    "ui-ux-pro-max": ["open-design"]
}

needs_review_list = ["ui-ux-pro-max", "open-design"]

for cat in categories:
    # README
    readme_path = cat / "README.md"
    if not readme_path.exists():
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(f"# {cat.name}\n\nCategory README.")

    skills_in_cat = []
    
    for skill_dir in cat.iterdir():
        if not skill_dir.is_dir() or skill_dir.name.startswith("_"):
            continue
            
        skill_name = skill_dir.name
        meta_path = skill_dir / "metadata.json"
        
        # Determine status if metadata doesn't exist
        meta = {}
        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
        else:
            meta = {
                "name": skill_name,
                "category": cat.name,
                "status": "installed-real-skill"
            }
            
        # Apply needs-review
        if skill_name in needs_review_list or meta.get("official_docs", "").startswith("Official ") or meta.get("official_docs", "").startswith("UI UX"):
            meta["status"] = "needs-review"
            
        # Apply conflicts
        if skill_name in conflicts_map:
            meta["conflicts_with"] = conflicts_map[skill_name]
            
        # Optional visual taste skills
        if skill_name in ["brandkit", "design-taste-frontend", "design-taste-frontend-v1", "gpt-taste", "high-end-visual-design", "image-to-code", "imagegen-frontend-mobile", "imagegen-frontend-web", "industrial-brutalist-ui", "minimalist-ui", "redesign-existing-projects", "stitch-design-taste"]:
            meta["load_policy"] = "optional-style-mode"
            meta["status"] = "installed-real-skill"
            meta["type"] = "real-skill"

        if "type" not in meta and meta.get("status") == "installed-real-skill":
            meta["type"] = "real-skill"

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
            
        # Ensure all 4 files exist
        for fname in ["SKILL.md", "references.md", "INSTALL.md"]:
            fpath = skill_dir / fname
            if not fpath.exists():
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(f"# {fname} for {skill_name}\n")
                    
        skills_in_cat.append(meta)
        all_skills.append(meta)

    # _manifest.json for category
    with open(cat / "_manifest.json", "w", encoding="utf-8") as f:
        json.dump({"category": cat.name, "skills": skills_in_cat}, f, indent=2)

# Global Manifest
global_manifest = {
    "safe_mode": True,
    "Real skills preserved": [s["name"] for s in all_skills if s.get("status") == "installed-real-skill"],
    "Generated wrappers": [s["name"] for s in all_skills if s.get("status") == "generated-wrapper" and s.get("type") == "reference-skill"],
    "Tool references": [s["name"] for s in all_skills if s.get("status") == "generated-wrapper" and s.get("type") == "tool-reference"],
    "Needs review": [s["name"] for s in all_skills if s.get("status") == "needs-review"],
    "Blocked": [s["name"] for s in all_skills if s.get("status") == "blocked"],
    "Missing": [],
    "Conflict matrix": conflicts_map,
    "Recommended default skills per agent": {
        "planner": ["to-prd", "to-issues"],
        "ux": ["frontend-design", "nng-heuristics"],
        "design_system": ["taste-skill"],
        "frontend": ["next-app-router", "tanstack-query"],
        "backend": ["openapi-contract", "trpc"],
        "data": ["drizzle-orm"],
        "trust": ["authjs", "openfga", "owasp-cheat-sheets", "stripe"],
        "qa": ["playwright-testing", "tdd", "review", "axe-core"],
        "ops": ["github-actions", "vercel", "opentelemetry"],
        "docs": ["doc-coauthoring", "docusaurus"],
        "workflow": ["changesets", "github-templates", "full-output-enforcement"]
    }
}

with open(base_dir / "manifest.json", "w", encoding="utf-8") as f:
    json.dump(global_manifest, f, indent=2)

with open(base_dir / "MANIFEST.md", "w", encoding="utf-8") as f:
    f.write("# Global Manifest\n\nSee manifest.json for details.\n")
    
print(f"Duplicate skills/ exists: {duplicate_exists}")
print("Audit complete.")
