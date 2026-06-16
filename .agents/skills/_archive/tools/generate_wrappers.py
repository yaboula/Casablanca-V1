import os
import json

base_dir = r"d:\Users\aboul\Desktop\ACD\.agents\skills"

wrappers = [
    {"name": "nng-heuristics", "category": "ux", "type": "reference-skill", "docs": "https://www.nngroup.com/articles/ten-usability-heuristics/", "conflicts": []},
    {"name": "shadcn-ui", "category": "ui-design-system", "type": "tool-reference", "docs": "https://ui.shadcn.com/docs", "conflicts": []},
    {"name": "radix-primitives", "category": "ui-design-system", "type": "tool-reference", "docs": "https://www.radix-ui.com/primitives/docs/overview/introduction", "conflicts": []},
    {"name": "open-design", "category": "ui-design-system", "type": "reference-skill", "docs": "Official Open Design Guidelines", "conflicts": ["ui-ux-pro-max"]},
    {"name": "ui-ux-pro-max", "category": "ui-design-system", "type": "reference-skill", "docs": "UI UX Pro Max Standards", "conflicts": ["open-design"]},
    {"name": "next-app-router", "category": "frontend", "type": "reference-skill", "docs": "https://nextjs.org/docs/app", "conflicts": []},
    {"name": "tanstack-query", "category": "frontend", "type": "tool-reference", "docs": "https://tanstack.com/query/latest", "conflicts": []},
    {"name": "playwright-cli", "category": "frontend", "type": "tool-reference", "docs": "https://playwright.dev/docs/intro", "conflicts": []},
    {"name": "openapi-contract", "category": "backend", "type": "reference-skill", "docs": "https://swagger.io/specification/", "conflicts": []},
    {"name": "trpc", "category": "backend", "type": "tool-reference", "docs": "https://trpc.io/docs", "conflicts": ["fastify"]},
    {"name": "fastify", "category": "backend", "type": "tool-reference", "docs": "https://fastify.dev/docs/latest/", "conflicts": ["trpc"]},
    {"name": "drizzle-orm", "category": "database", "type": "tool-reference", "docs": "https://orm.drizzle.team/docs/overview", "conflicts": ["prisma-orm"]},
    {"name": "prisma-orm", "category": "database", "type": "tool-reference", "docs": "https://www.prisma.io/docs/", "conflicts": ["drizzle-orm"]},
    {"name": "authjs", "category": "auth-permissions", "type": "tool-reference", "docs": "https://authjs.dev/reference", "conflicts": ["better-auth"]},
    {"name": "better-auth", "category": "auth-permissions", "type": "tool-reference", "docs": "https://better-auth.com/", "conflicts": ["authjs"]},
    {"name": "openfga", "category": "auth-permissions", "type": "tool-reference", "docs": "https://openfga.dev/docs", "conflicts": []},
    {"name": "owasp-cheat-sheets", "category": "security", "type": "reference-skill", "docs": "https://cheatsheetseries.owasp.org/", "conflicts": []},
    {"name": "owasp-zap", "category": "security", "type": "tool-reference", "docs": "https://www.zaproxy.org/docs/", "conflicts": []},
    {"name": "stripe", "category": "payments", "type": "tool-reference", "docs": "https://stripe.com/docs", "conflicts": []},
    {"name": "openapi-integration", "category": "integrations", "type": "reference-skill", "docs": "https://swagger.io/specification/", "conflicts": []},
    {"name": "mcp-protocol", "category": "integrations", "type": "reference-skill", "docs": "https://modelcontextprotocol.io/", "conflicts": []},
    {"name": "uploadthing", "category": "files-media", "type": "tool-reference", "docs": "https://docs.uploadthing.com/", "conflicts": []},
    {"name": "cloudinary", "category": "files-media", "type": "tool-reference", "docs": "https://cloudinary.com/documentation", "conflicts": []},
    {"name": "resend", "category": "notifications", "type": "tool-reference", "docs": "https://resend.com/docs", "conflicts": []},
    {"name": "novu", "category": "notifications", "type": "tool-reference", "docs": "https://docs.novu.co/", "conflicts": []},
    {"name": "refine-core", "category": "admin-tools", "type": "tool-reference", "docs": "https://refine.dev/docs/", "conflicts": ["react-admin"]},
    {"name": "react-admin", "category": "admin-tools", "type": "tool-reference", "docs": "https://marmelab.com/react-admin/Readme.html", "conflicts": ["refine-core"]},
    {"name": "playwright-testing", "category": "testing-qa", "type": "tool-reference", "docs": "https://playwright.dev/docs/intro", "conflicts": []},
    {"name": "vitest", "category": "testing-qa", "type": "tool-reference", "docs": "https://vitest.dev/guide/", "conflicts": []},
    {"name": "storybook", "category": "testing-qa", "type": "tool-reference", "docs": "https://storybook.js.org/docs", "conflicts": []},
    {"name": "lighthouse-ci", "category": "performance", "type": "tool-reference", "docs": "https://github.com/GoogleChrome/lighthouse-ci", "conflicts": []},
    {"name": "core-web-vitals", "category": "performance", "type": "reference-skill", "docs": "https://web.dev/explore/learn-core-web-vitals", "conflicts": []},
    {"name": "wcag-22", "category": "accessibility", "type": "reference-skill", "docs": "https://www.w3.org/TR/WCAG22/", "conflicts": []},
    {"name": "axe-core", "category": "accessibility", "type": "tool-reference", "docs": "https://github.com/dequelabs/axe-core", "conflicts": []},
    {"name": "github-actions", "category": "devops", "type": "tool-reference", "docs": "https://docs.github.com/en/actions", "conflicts": []},
    {"name": "vercel", "category": "devops", "type": "tool-reference", "docs": "https://vercel.com/docs", "conflicts": []},
    {"name": "opentelemetry", "category": "observability", "type": "tool-reference", "docs": "https://opentelemetry.io/docs/", "conflicts": []},
    {"name": "docusaurus", "category": "documentation", "type": "tool-reference", "docs": "https://docusaurus.io/docs", "conflicts": []},
    {"name": "changesets", "category": "git-workflow", "type": "tool-reference", "docs": "https://github.com/changesets/changesets", "conflicts": ["semantic-release"]},
    {"name": "semantic-release", "category": "git-workflow", "type": "tool-reference", "docs": "https://semantic-release.gitbook.io/semantic-release/", "conflicts": ["changesets"]},
    {"name": "github-templates", "category": "git-workflow", "type": "reference-skill", "docs": "https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests", "conflicts": []}
]

for w in wrappers:
    # 1. Create directory
    target_dir = os.path.join(base_dir, w["category"], w["name"])
    os.makedirs(target_dir, exist_ok=True)
    
    # 2. metadata.json
    metadata = {
        "name": w["name"],
        "category": w["category"],
        "priority": "P1" if "p2" not in w["name"] else "P2",
        "type": w["type"],
        "status": "generated-wrapper",
        "source": f"generated locally from official {w['name']} documentation",
        "official_docs": w["docs"],
        "install_method": "none" if w["type"] == "reference-skill" else "manual-per-project",
        "recommended_agent": f"{w['category'].capitalize()} Agent",
        "load_policy": "on-demand" if w["type"] == "tool-reference" else "default",
        "risks": [
            f"Automated checks do not cover all {w['name']} requirements",
            "Do not install into package.json without explicit project-level approval"
        ]
    }
    
    if w["conflicts"]:
        metadata["conflicts_with"] = w["conflicts"]
        metadata["risks"].insert(0, f"Do not mix with {', '.join(w['conflicts'])} as a default unless the project explicitly chooses both")
        
    with open(os.path.join(target_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 3. SKILL.md
    skill_md = f"""# {w['name']} (Generated Wrapper)

> **WARNING: NOT AN OFFICIAL SKILL**
> This is a generated wrapper to serve as a reference skill. It is NOT an official agent skill downloaded from a vendor.
> **DO NOT** install dependencies into `package.json` without explicit approval from the user.

## Cuándo usar esta referencia
- Cuando el flujo de trabajo, arquitectura o issue requiera consultar o aplicar estándares de `{w['name']}`.
- Cuando necesites entender las mejores prácticas o APIs oficiales de esta herramienta.

## Cuándo NO usarla
- Si el proyecto ya utiliza un estándar conflictivo (ej. {', '.join(w['conflicts']) if w['conflicts'] else 'otro stack'}).
- Para intentar instalar librerías automáticamente; **esto está estrictamente prohibido**.

## Documentación oficial a consultar
Debes consultar obligatoriamente: {w['docs']}

## Checks que debe ejecutar el agente
1. Verificar si la tecnología/referencia está explícitamente aprobada para el proyecto actual.
2. Validar que no haya conflictos en el `package.json` con otras librerías.
3. Asegurar que las implementaciones cumplan con las reglas de {w['name']}.

## Riesgos y conflictos
- Instalar dependencias no deseadas sin consultar al usuario.
{'- Conflictos con: ' + ', '.join(w['conflicts']) if w['conflicts'] else '- Ningún conflicto conocido.'}

## Restricción de dependencias
**ESTRICTAMENTE PROHIBIDO:** No ejecutes `npm install`, `pnpm add`, `npm init`, `npx` ni instaladores de proyecto basados en este documento sin aprobación explícita del desarrollador.
"""
    with open(os.path.join(target_dir, "SKILL.md"), "w", encoding="utf-8") as f:
        f.write(skill_md)

    # 4. references.md
    references_md = f"""# Referencias Externas para {w['name']}

- Documentación Oficial: {w['docs']}
- Consideraciones: Al ser un `generated-wrapper`, utiliza las herramientas de búsqueda web para consultar la documentación en tiempo real si requieres detalles precisos.
"""
    with open(os.path.join(target_dir, "references.md"), "w", encoding="utf-8") as f:
        f.write(references_md)

    # 5. INSTALL.md
    install_md = f"""# Instalación de {w['name']}

Este skill está marcado como `{w['type']}` y tiene `install_method: {metadata['install_method']}`.

**REGLA DE ORO:** No ejecutes instalación en el repositorio objetivo (`package.json`) a menos que el usuario lo solicite expresamente en la sesión actual. 
"""
    with open(os.path.join(target_dir, "INSTALL.md"), "w", encoding="utf-8") as f:
        f.write(install_md)

print("Wrappers generated successfully.")
