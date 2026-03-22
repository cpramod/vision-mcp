#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";
const API_KEY = process.env.OPENAI_API_KEY || process.env.API_KEY || "";
const BASE_URL = process.env.OPENAI_BASE_URL || process.env.API_BASE_URL;
const MODEL = process.env.VISION_MODEL || process.env.MODEL || "gpt-4o";
const openai = new OpenAI({
    apiKey: API_KEY,
    ...(BASE_URL && { baseURL: BASE_URL }),
});
console.error(`Vision MCP Configuration:`);
console.error(`  Model: ${MODEL}`);
if (BASE_URL) {
    console.error(`  Base URL: ${BASE_URL}`);
}
console.error(`  API Key: ${API_KEY ? "configured" : "not set"}`);
const server = new Server({ name: "vision-mcp", version: "1.0.0" }, { capabilities: { tools: {}, resources: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "analyze_image",
                description: "Analyze an image using vision AI. Provide either a URL or base64-encoded image data. Returns detailed analysis including objects, text, colors, scene description, and more.",
                inputSchema: {
                    type: "object",
                    properties: {
                        image: {
                            type: "string",
                            description: "Either a URL to the image or base64-encoded image data (with or without data URI prefix)",
                        },
                        prompt: {
                            type: "string",
                            description: "Custom prompt for analysis. Defaults to general image analysis if not provided.",
                        },
                        detail: {
                            type: "string",
                            enum: ["low", "high", "auto"],
                            description: "Level of detail for analysis. 'low' for faster processing, 'high' for detailed analysis. Defaults to 'auto'.",
                        },
                    },
                    required: ["image"],
                },
            },
            {
                name: "compare_images",
                description: "Compare two or more images and describe their differences, similarities, or relationships.",
                inputSchema: {
                    type: "object",
                    properties: {
                        images: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of image URLs or base64-encoded images (2-4 images)",
                            minItems: 2,
                            maxItems: 4,
                        },
                        prompt: {
                            type: "string",
                            description: "Custom comparison prompt. Defaults to general comparison.",
                        },
                    },
                    required: ["images"],
                },
            },
            {
                name: "extract_text",
                description: "Extract and transcribe text from an image (OCR). Useful for documents, screenshots, signs, etc.",
                inputSchema: {
                    type: "object",
                    properties: {
                        image: {
                            type: "string",
                            description: "Either a URL to the image or base64-encoded image data",
                        },
                        preserve_formatting: {
                            type: "boolean",
                            description: "Whether to preserve text formatting and layout. Defaults to true.",
                        },
                    },
                    required: ["image"],
                },
            },
            {
                name: "describe_scene",
                description: "Get a detailed description of a scene, including spatial relationships, atmosphere, and context.",
                inputSchema: {
                    type: "object",
                    properties: {
                        image: {
                            type: "string",
                            description: "Either a URL to the image or base64-encoded image data",
                        },
                        focus: {
                            type: "string",
                            description: "What to focus the description on (e.g., 'people', 'architecture', 'nature')",
                        },
                    },
                    required: ["image"],
                },
            },
        ],
    };
});
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: [] };
});
server.setRequestHandler(ReadResourceRequestSchema, async () => {
    throw new Error("No resources available");
});
function isUrl(str) {
    try {
        new URL(str);
        return str.startsWith("http://") || str.startsWith("https://");
    }
    catch {
        return false;
    }
}
function prepareImageContent(image) {
    if (isUrl(image)) {
        return {
            type: "image_url",
            image_url: { url: image },
        };
    }
    // Handle base64 data
    let base64Data = image;
    let mimeType = "image/jpeg";
    if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
            mimeType = match[1];
            base64Data = match[2];
        }
    }
    else {
        // Detect MIME type from base64 header
        const header = base64Data.substring(0, 10);
        if (header.startsWith("/9j/"))
            mimeType = "image/jpeg";
        else if (header.startsWith("iVBORw0KGgo"))
            mimeType = "image/png";
        else if (header.startsWith("R0lGOD"))
            mimeType = "image/gif";
        else if (header.startsWith("UklGR"))
            mimeType = "image/webp";
        base64Data = `data:${mimeType};base64,${base64Data}`;
    }
    return {
        type: "image_url",
        image_url: { url: base64Data },
    };
}
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        return {
            content: [{ type: "text", text: "Error: No arguments provided" }],
            isError: true,
        };
    }
    try {
        switch (name) {
            case "analyze_image": {
                const { image, prompt, detail } = args;
                if (!image) {
                    return {
                        content: [{ type: "text", text: "Error: 'image' parameter is required" }],
                        isError: true,
                    };
                }
                const imageContent = prepareImageContent(image);
                if (detail && ["low", "high", "auto"].includes(detail) && imageContent.type === "image_url") {
                    imageContent.image_url.detail = detail;
                }
                const content = [
                    {
                        type: "text",
                        text: prompt || "Analyze this image in detail. Describe: 1) Main subjects and objects, 2) Colors and visual style, 3) Text or labels visible, 4) Scene context and setting, 5) Notable details or interesting elements, 6) Overall mood or atmosphere.",
                    },
                    imageContent,
                ];
                const response = await openai.chat.completions.create({
                    model: MODEL,
                    messages: [{ role: "user", content }],
                    max_tokens: 2000,
                });
                return {
                    content: [{ type: "text", text: response.choices[0].message.content || "No analysis available" }],
                };
            }
            case "compare_images": {
                const { images, prompt } = args;
                if (!images || !Array.isArray(images) || images.length < 2) {
                    return {
                        content: [{ type: "text", text: "Error: 'images' must be an array with at least 2 images" }],
                        isError: true,
                    };
                }
                const imageContents = images.slice(0, 4).map(prepareImageContent);
                const content = [
                    {
                        type: "text",
                        text: prompt || "Compare these images. Describe: 1) Key similarities, 2) Key differences, 3) Relationships between the images, 4) Overall comparison summary.",
                    },
                    ...imageContents,
                ];
                const response = await openai.chat.completions.create({
                    model: MODEL,
                    messages: [{ role: "user", content }],
                    max_tokens: 2000,
                });
                return {
                    content: [{ type: "text", text: response.choices[0].message.content || "No comparison available" }],
                };
            }
            case "extract_text": {
                const { image, preserve_formatting = true } = args;
                if (!image) {
                    return {
                        content: [{ type: "text", text: "Error: 'image' parameter is required" }],
                        isError: true,
                    };
                }
                const imageContent = prepareImageContent(image);
                const promptText = preserve_formatting
                    ? "Extract all text from this image. Preserve the original formatting, layout, and structure as much as possible. Use newlines and spacing to maintain the visual organization. If there's no text, say 'No text detected in this image.'"
                    : "Extract all text from this image as plain text. If there's no text, say 'No text detected in this image.'";
                const content = [
                    { type: "text", text: promptText },
                    imageContent,
                ];
                const response = await openai.chat.completions.create({
                    model: MODEL,
                    messages: [{ role: "user", content }],
                    max_tokens: 2000,
                });
                return {
                    content: [{ type: "text", text: response.choices[0].message.content || "No text extracted" }],
                };
            }
            case "describe_scene": {
                const { image, focus } = args;
                if (!image) {
                    return {
                        content: [{ type: "text", text: "Error: 'image' parameter is required" }],
                        isError: true,
                    };
                }
                const imageContent = prepareImageContent(image);
                const promptText = focus
                    ? `Provide a detailed description of this scene, focusing specifically on ${focus}. Include spatial relationships, atmosphere, context, and relevant details.`
                    : "Provide a comprehensive description of this scene. Include: 1) Overall setting and location, 2) Spatial relationships between elements, 3) Atmosphere and mood, 4) Lighting and time of day if apparent, 5) Any activities or actions taking place, 6) Environmental context.";
                const content = [
                    { type: "text", text: promptText },
                    imageContent,
                ];
                const response = await openai.chat.completions.create({
                    model: MODEL,
                    messages: [{ role: "user", content }],
                    max_tokens: 2000,
                });
                return {
                    content: [{ type: "text", text: response.choices[0].message.content || "No description available" }],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Vision MCP server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
