# Custom Scaffolder Actions for RHDH

This directory contains custom scaffolder actions for Red Hat Developer Hub (RHDH), including a powerful action to trigger templates from within other templates.

## What's Included

### Actions

- **`trigger:template`** - Triggers another scaffolder template from within a template execution

### Features

- Trigger one template from another (Template 1 → Template 2)
- Pass values between templates
- Wait for completion or trigger async
- Full error handling and logging
- TypeScript with full type safety

## Quick Start

### 1. Install Dependencies

```bash
cd examples/custom-actions
yarn install
```

### 2. Build the Plugin

```bash
yarn build
```

### 3. Use in Your RHDH Instance

See the [Custom Scaffolder Actions Guide](../../docs/custom-scaffolder-actions.md) for detailed integration instructions.

## Project Structure

```
examples/custom-actions/
├── src/
│   ├── actions/
│   │   ├── triggerTemplate.ts    # Main trigger template action
│   │   └── index.ts               # Action exports
│   └── index.ts                   # Module entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Usage Example

In your template YAML:

```yaml
steps:
  - id: trigger-service
    name: Create Dependent Service
    action: trigger:template
    input:
      templateRef: template:default/my-service-template
      values:
        name: my-service
        description: My dependent service
      waitForCompletion: false
```

## Action Parameters

### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateRef` | string | Yes | Reference to the template to trigger (e.g., `template:default/my-template`) |
| `values` | object | Yes | Input values to pass to the template |
| `targetPath` | string | No | Optional target path for the scaffolded output |
| `waitForCompletion` | boolean | No | Whether to wait for the triggered template to complete (default: false) |

### Output

| Parameter | Type | Description |
|-----------|------|-------------|
| `taskId` | string | ID of the triggered scaffolder task |
| `taskUrl` | string | URL to view the task status |
| `status` | string | Status of the task (only if `waitForCompletion` is true) |

## Development

### Build

```bash
yarn build
```

### Watch Mode

```bash
yarn watch
```

### Clean

```bash
yarn clean
```

## Testing

The action can be tested in multiple ways:

1. **Unit Tests** - Test the action logic in isolation
2. **Integration Tests** - Test with a running RHDH instance
3. **Manual Tests** - Use the template examples to trigger the action

See the [Testing Section](../../docs/custom-scaffolder-actions.md#testing-your-custom-action) in the guide for details.

## Adding More Actions

To add more custom actions:

1. Create a new file in `src/actions/` (e.g., `myAction.ts`)
2. Implement your action using `createTemplateAction`
3. Export it from `src/actions/index.ts`
4. Add it to the `getCustomActions` function

Example:

```typescript
// src/actions/myAction.ts
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

export function createMyAction() {
  return createTemplateAction({
    id: 'my:action',
    description: 'Does something awesome',
    schema: {
      input: { /* ... */ },
      output: { /* ... */ },
    },
    async handler(ctx) {
      // Your action logic here
    },
  });
}

// src/actions/index.ts
export { createMyAction } from './myAction';
export function getCustomActions(options) {
  return [
    createTriggerTemplateAction(options),
    createMyAction(options),  // Add your new action
  ];
}
```

## Documentation

- [Full Custom Scaffolder Actions Guide](../../docs/custom-scaffolder-actions.md)
- [Local RHDH Setup Guide](../../docs/local-setup-guide.md)
- [Template Examples](../templates/)

## License

Apache-2.0

## Support

For issues or questions:
- Check the [documentation](../../docs/)
- Review the [example templates](../templates/)
- Open an issue in the repository
