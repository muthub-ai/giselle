# Experimental Generation Implementation

This directory contains an experimental implementation of the text generation system that introduces a new schema-based approach for handling AI generation workflows.

## Overview

The experimental implementation reimagines the generation system with:

- **Parts-based I/O Structure**: Input and output are composed of discrete parts (text, files, etc.)
- **Enhanced Trigger System**: Support for user, MCP, and GitHub triggers
- **Improved Type Safety**: Leverages Zod v4 for runtime type validation
- **Flexible Content Composition**: Modular approach to building generation requests
- **Experimental Telemetry**: Enhanced tracking and monitoring capabilities

## Key Differences from Legacy Implementation

### Schema Structure

**Legacy Approach:**
```typescript
// Single-type outputs
{
  type: "generated-text",
  content: "response text",
  outputId: "otp-123"
}
```

**Experimental Approach:**
```typescript
// Parts-based outputs
{
  id: "otp-123",
  parts: [
    { type: "part.text", text: "response text" },
    { type: "part.file", fileId: "fl-456", workspaceId: "wrks-789" }
  ]
}
```

### Trigger System

**Legacy:**
- Basic trigger context
- Limited trigger type support

**Experimental:**
```typescript
// User trigger
{
  type: "user",
  workspaceId: "wrks-123",
  interface: "studio" | "api"
}

// MCP trigger
{
  type: "mcp",
  triggerId: "trg-mcp-456"
}

// GitHub trigger
{
  type: "github", 
  triggerId: "trg-github-789"
}
```

## Files Structure

```
experimental/
├── README.md                    # This file
├── schema.ts                    # Original Zod schema definitions
├── types.ts                     # Type definitions and exports
├── generate-text.ts             # Main generation function
├── use-generation-executor.ts   # Generation execution logic
├── utils.ts                     # Message building utilities
├── set-generation.ts           # Storage operations
├── telemetry.ts                # Telemetry handling
├── index.ts                    # Public exports
└── example.ts                  # Usage examples
```

## Usage

### Basic Text Generation

```typescript
import { generateTextExperimental, createExperimentalTextPart } from './experimental';

const queuedGeneration = {
  operationNode: {
    id: "nd-example",
    type: "operation",
    content: {
      type: "textGeneration",
      llm: {
        provider: "anthropic",
        id: "claude-3-5-sonnet-20241022",
        configurations: { reasoning: false }
      },
      prompt: "Hello, world!"
    },
    inputs: [...],
    outputs: [...]
  },
  trigger: {
    type: "user",
    workspaceId: "wrks-123",
    interface: "studio"
  },
  status: "queued",
  queuedAt: Date.now(),
  inputs: [{
    id: "inp-1",
    parts: [createExperimentalTextPart("Input text")]
  }],
  outputs: []
};

const result = await generateTextExperimental({
  context: giselleEngineContext,
  generation: queuedGeneration,
  telemetry: { metadata: { source: "example" } }
});
```

### Working with Parts

```typescript
import { 
  createExperimentalTextPart, 
  createExperimentalFilePart,
  experimentalPartsToText 
} from './experimental';

// Create text part
const textPart = createExperimentalTextPart("Analyze this document:");

// Create file part
const filePart = createExperimentalFilePart("fl-doc-123", "wrks-456");

// Combine parts
const input = {
  id: "inp-analysis",
  parts: [textPart, filePart]
};

// Extract text from output parts
const outputText = experimentalPartsToText(generation.outputs[0].parts);
```

## Key Features

### 1. Parts-Based Architecture

The experimental system uses a parts-based approach where inputs and outputs are composed of discrete, typed parts:

- `part.text`: Plain text content
- `part.file`: File references with workspace context

This allows for more flexible composition and better handling of mixed content types.

### 2. Enhanced Trigger System

Three types of triggers are supported:

- **User Triggers**: Initiated by users through studio or API
- **MCP Triggers**: Model Context Protocol integrations
- **GitHub Triggers**: GitHub-based automations

### 3. Improved Type Safety

Uses Zod v4 for comprehensive runtime type validation and TypeScript integration.

### 4. Experimental Storage

Isolated storage layer that doesn't interfere with the existing generation system:

```typescript
// Stored under experimental/ prefix
await internalSetExperimentalGeneration({
  storage,
  generation: experimentalGeneration
});
```

### 5. Enhanced Telemetry

Extended telemetry with experimental tags and features:

```typescript
const tags = createExperimentalTelemetryTags({
  provider: "anthropic",
  languageModel,
  toolSet,
  experimentalFeatures: ["new-schema", "parts-based-output"]
});
```

## Migration Considerations

### Compatibility

- **Legacy System**: Remains unchanged and fully functional
- **Experimental System**: Runs in parallel with isolated storage
- **No Breaking Changes**: Existing code continues to work unchanged

### Gradual Adoption

1. **Phase 1**: Test experimental features in development
2. **Phase 2**: Run experimental system in parallel
3. **Phase 3**: Migrate specific use cases
4. **Phase 4**: Consider full migration based on results

### Type Bridges

The experimental system includes type bridges for compatibility with legacy telemetry and monitoring systems.

## Current Limitations

- **Image Generation**: Simplified placeholder implementation
- **Complex Tool Integration**: Some advanced tool features may need adaptation
- **Storage Methods**: Limited storage operations (listKeys, deleteItem not fully supported)
- **Legacy Telemetry**: Some telemetry functions use placeholder implementations

## Development Guidelines

### Adding New Features

1. Define types in `types.ts`
2. Implement logic in appropriate files
3. Add exports to `index.ts`
4. Include examples in `example.ts`
5. Update this README

### Code Style

- Follow existing Biome formatting rules
- Use proper TypeScript types (avoid `any`)
- Include comprehensive error handling
- Add telemetry tags for experimental features

### Testing

```bash
# Run type checking
pnpm -F giselle-engine check-types

# Run linting
pnpm biome check --write packages/giselle-engine/src/core/generations/experimental/

# Test experimental functionality
# (Add specific test commands as they become available)
```

## Future Enhancements

- [ ] Complete image generation implementation
- [ ] Enhanced storage operations
- [ ] Advanced MCP trigger handling
- [ ] GitHub webhook integration
- [ ] Performance optimizations
- [ ] Comprehensive test coverage
- [ ] Migration utilities

## Contributing

When contributing to the experimental implementation:

1. Maintain compatibility with the legacy system
2. Follow the parts-based architecture
3. Include appropriate telemetry tags
4. Update examples and documentation
5. Ensure type safety throughout

## Questions or Issues

For questions about the experimental implementation, please refer to:

- Code examples in `example.ts`
- Type definitions in `types.ts`
- Implementation details in individual module files
- Legacy implementation for comparison patterns