# Vision MCP

A Model Context Protocol (MCP) server that provides image analysis capabilities using vision-capable AI models.

## Features

- **Image Analysis**: Analyze images for objects, text, colors, and context
- **Image Comparison**: Compare multiple images and identify differences
- **Text Extraction (OCR)**: Extract text from images with formatting preservation
- **Scene Description**: Get detailed descriptions of scenes and settings

## Installation

### Option 1: Use directly with npx (no install needed)

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "vision": {
      "command": "npx",
      "args": ["github:cpramod/vision-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Option 2: Install globally from GitHub

```bash
npm install -g github:YOUR_USERNAME/imageify
```

Then use in Claude Desktop config:
```json
{
  "mcpServers": {
    "vision": {
      "command": "vision-mcp",
      "env": {
        "OPENAI_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Option 3: Install from local clone

```bash
git clone https://github.com/cpramod/vision-mcp.git
cd imageify
npm install
npm run build
```

Then use the local path in Claude Desktop config:
```json
{
  "mcpServers": {
    "vision": {
      "command": "node",
      "args": ["/path/to/imageify/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Configuration

**Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` or `API_KEY` | API key for the vision provider | For most providers |
| `OPENAI_BASE_URL` or `API_BASE_URL` | Custom API endpoint URL | For third-party providers |
| `VISION_MODEL` or `MODEL` | Model name to use | No (defaults to `gpt-4o`) |

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

**OpenAI:**
```json
{
  "mcpServers": {
    "vision": {
      "command": "npx",
      "args": ["github:cpramod/vision-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

**Third-Party Providers (OpenAI-compatible APIs):**

*Anthropic Claude via OpenRouter:*
```json
{
  "mcpServers": {
    "vision": {
      "command": "npx",
      "args": ["github:cpramod/vision-mcp"],
      "env": {
        "OPENAI_BASE_URL": "https://openrouter.ai/api/v1",
        "OPENAI_API_KEY": "your-openrouter-key",
        "VISION_MODEL": "anthropic/claude-3.5-sonnet"
      }
    }
  }
}
```

*Google Gemini via OpenRouter:*
```json
{
  "mcpServers": {
    "vision": {
      "command": "npx",
      "args": ["github:cpramod/vision-mcp"],
      "env": {
        "OPENAI_BASE_URL": "https://openrouter.ai/api/v1",
        "OPENAI_API_KEY": "your-openrouter-key",
        "VISION_MODEL": "google/gemini-pro-vision"
      }
    }
  }
}
```

*Ollama (local):*
```json
{
  "mcpServers": {
    "vision": {
      "command": "npx",
      "args": ["github:cpramod/vision-mcp"],
      "env": {
        "OPENAI_BASE_URL": "http://localhost:11434/v1",
        "VISION_MODEL": "llava"
      }
    }
  }
}
```

*Groq:*
```json
{
  "mcpServers": {
    "vision": {
      "command": "npx",
      "args": ["github:cpramod/vision-mcp"],
      "env": {
        "OPENAI_BASE_URL": "https://api.groq.com/openai/v1",
        "OPENAI_API_KEY": "your-groq-key",
        "VISION_MODEL": "llama-3.2-11b-vision-preview"
      }
    }
  }
}
```

*LM Studio (local):*
```json
{
  "mcpServers": {
    "vision": {
      "command": "npx",
      "args": ["github:cpramod/vision-mcp"],
      "env": {
        "OPENAI_BASE_URL": "http://localhost:1234/v1",
        "VISION_MODEL": "local-model"
      }
    }
  }
}
```

## Available Tools

### analyze_image

Analyze an image using vision AI.

**Parameters:**
- `image` (required): URL or base64-encoded image data
- `prompt` (optional): Custom analysis prompt
- `detail` (optional): "low", "high", or "auto" detail level

**Example:**
```json
{
  "name": "analyze_image",
  "arguments": {
    "image": "https://example.com/image.jpg",
    "prompt": "What's in this image?"
  }
}
```

### compare_images

Compare 2-4 images.

**Parameters:**
- `images` (required): Array of image URLs or base64 data (2-4 images)
- `prompt` (optional): Custom comparison prompt

### extract_text

Extract text from images (OCR).

**Parameters:**
- `image` (required): URL or base64-encoded image
- `preserve_formatting` (optional): Maintain layout (default: true)

### describe_scene

Get detailed scene descriptions.

**Parameters:**
- `image` (required): URL or base64-encoded image
- `focus` (optional): Focus area (e.g., "people", "architecture")

## Supported Image Formats

- JPEG, PNG, GIF, WebP
- URLs or base64-encoded data URIs

## Development

```bash
npm run dev    # Build and run
npm run build  # Compile TypeScript
npm start      # Run compiled server
```

## Publishing to npm (optional)

```bash
npm login
npm publish
```

After publishing to npm, users can install with:
```json
{
  "mcpServers": {
    "vision": {
      "command": "npx",
      "args": ["vision-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-api-key"
      }
    }
  }
}
```