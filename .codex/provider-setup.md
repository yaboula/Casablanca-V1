# Provider Setup

Provider configuration must be user-level only.

Do not put providers, API keys or secrets in this repository.

Use:

```txt
~/.codex/config.toml
```

Primary configuration for Fireworks:

```toml
[model_providers.fireworks]
name = "Fireworks"
base_url = "https://api.fireworks.ai/inference/v1"
env_key = "FIREWORKS_API_KEY"
wire_api = "responses"
```

Windows PowerShell session variable:

```powershell
$env:FIREWORKS_API_KEY="your_key_here"
```

Windows permanent variable:

```powershell
setx FIREWORKS_API_KEY "your_key_here"
```

Do not commit real keys.

Current provider target for non-OpenAI subagents:

```txt
fireworks
```

Model IDs used by this project:

```txt
accounts/fireworks/models/kimi-k2p6
accounts/fireworks/models/deepseek-v4-pro
gpt-5.4
```

If Codex or Fireworks rejects these IDs, mark the provider status as `needs-provider-verification`.
