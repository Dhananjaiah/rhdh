# Custom Scaffolder Actions in RHDH

This comprehensive guide shows you how to create custom scaffolder actions in Red Hat Developer Hub (RHDH), including a complete example of creating an action that triggers another template.

## Table of Contents
1. [Understanding Scaffolder Actions](#understanding-scaffolder-actions)
2. [Prerequisites](#prerequisites)
3. [Creating a Custom Action Plugin](#creating-a-custom-action-plugin)
4. [Template Trigger Action Example](#template-trigger-action-example)
5. [Registering the Custom Action](#registering-the-custom-action)
6. [Using the Custom Action in Templates](#using-the-custom-action-in-templates)
7. [Testing Your Custom Action](#testing-your-custom-action)
8. [Deployment](#deployment)

## Understanding Scaffolder Actions

Scaffolder actions are the building blocks of RHDH templates. They perform specific tasks during the scaffolding process, such as:

- Fetching templates
- Creating files
- Publishing to Git
- **Triggering other templates** (our focus)
- Running custom business logic

### Why Create a Custom Action?

You might want to create a custom action to:
- Trigger one template from another (Template 1 → Template 2)
- Integrate with internal systems
- Implement custom validation logic
- Add organization-specific functionality
- Automate complex workflows

## Prerequisites

- Node.js 18+ installed
- Yarn package manager
- RHDH running locally (see [Local Setup Guide](local-setup-guide.md))
- Basic TypeScript/JavaScript knowledge
- Understanding of Backstage plugin architecture

## Creating a Custom Action Plugin

### Step 1: Set Up Plugin Development Environment

```bash
# Create a directory for your custom actions
mkdir -p ~/rhdh-custom-actions
cd ~/rhdh-custom-actions

# Initialize a new package
yarn init -y

# Install required dependencies
yarn add @backstage/backend-common @backstage/backend-plugin-api @backstage/plugin-scaffolder-node
yarn add @backstage/catalog-client @backstage/catalog-model
yarn add node-fetch zod

# Install dev dependencies
yarn add -D @types/node typescript @backstage/cli
```

### Step 2: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "CommonJS",
    "lib": ["ES2021"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Update package.json

Update your `package.json`:

```json
{
  "name": "scaffolder-backend-module-custom-actions",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@backstage/backend-common": "^0.21.0",
    "@backstage/backend-plugin-api": "^0.6.10",
    "@backstage/plugin-scaffolder-node": "^0.4.0",
    "@backstage/catalog-client": "^1.6.0",
    "@backstage/catalog-model": "^1.4.0",
    "node-fetch": "^2.7.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Template Trigger Action Example

This is the core implementation of a custom action that triggers another template from within a running template.

### Step 4: Create the Trigger Template Action

Create `src/actions/triggerTemplate.ts`:

```typescript
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { CatalogClient } from '@backstage/catalog-client';
import { Config } from '@backstage/config';
import fetch from 'node-fetch';
import { z } from 'zod';

/**
 * Input schema for the trigger template action
 */
const inputSchema = z.object({
  templateRef: z.string().describe('Reference to the template to trigger (e.g., template:default/my-template)'),
  values: z.record(z.any()).describe('Input values to pass to the template'),
  targetPath: z.string().optional().describe('Optional target path for the scaffolded output'),
  waitForCompletion: z.boolean().optional().default(false).describe('Whether to wait for the triggered template to complete'),
});

/**
 * Output schema for the trigger template action
 */
const outputSchema = z.object({
  taskId: z.string().describe('ID of the triggered scaffolder task'),
  taskUrl: z.string().describe('URL to view the task status'),
  status: z.string().optional().describe('Status of the task if waitForCompletion is true'),
});

/**
 * Creates a custom scaffolder action that triggers another template
 */
export function createTriggerTemplateAction(options: {
  config: Config;
  catalogClient: CatalogClient;
}) {
  const { config, catalogClient } = options;
  
  return createTemplateAction({
    id: 'trigger:template',
    description: 'Triggers another scaffolder template from within a template execution',
    schema: {
      input: inputSchema,
      output: outputSchema,
    },
    
    async handler(ctx) {
      const { templateRef, values, targetPath, waitForCompletion } = ctx.input;
      
      ctx.logger.info(`Triggering template: ${templateRef}`);
      
      // Get backend URL from config
      const backendUrl = config.getString('backend.baseUrl');
      
      // Resolve the template entity from the catalog
      const templateEntity = await catalogClient.getEntityByRef(templateRef);
      
      if (!templateEntity) {
        throw new Error(`Template not found: ${templateRef}`);
      }
      
      if (templateEntity.kind !== 'Template') {
        throw new Error(`Entity ${templateRef} is not a Template`);
      }
      
      ctx.logger.info(`Found template: ${templateEntity.metadata.name}`);
      
      // Prepare the scaffolder task request
      const taskRequest = {
        templateRef: templateRef,
        values: {
          ...values,
          ...(targetPath && { targetPath }),
        },
      };
      
      // Trigger the scaffolder task
      const response = await fetch(`${backendUrl}/api/scaffolder/v2/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskRequest),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to trigger template: ${response.status} ${errorText}`);
      }
      
      const taskResponse = await response.json() as { id: string };
      const taskId = taskResponse.id;
      const taskUrl = `${backendUrl}/api/scaffolder/v2/tasks/${taskId}`;
      
      ctx.logger.info(`Template triggered successfully. Task ID: ${taskId}`);
      
      // Set output
      ctx.output('taskId', taskId);
      ctx.output('taskUrl', taskUrl);
      
      // Wait for completion if requested
      if (waitForCompletion) {
        ctx.logger.info('Waiting for task completion...');
        
        const status = await waitForTaskCompletion(taskUrl, ctx.logger);
        ctx.output('status', status);
        
        if (status === 'failed') {
          throw new Error(`Triggered template task failed: ${taskId}`);
        }
        
        ctx.logger.info(`Task completed with status: ${status}`);
      }
    },
  });
}

/**
 * Helper function to wait for task completion
 */
async function waitForTaskCompletion(
  taskUrl: string,
  logger: any,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(taskUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.status}`);
    }
    
    const task = await response.json() as { status: string };
    
    logger.info(`Task status: ${task.status} (attempt ${i + 1}/${maxAttempts})`);
    
    if (task.status === 'completed') {
      return 'completed';
    }
    
    if (task.status === 'failed') {
      return 'failed';
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Timeout waiting for task completion');
}
```

### Step 5: Create Additional Helper Actions

Create `src/actions/index.ts`:

```typescript
import { createTriggerTemplateAction } from './triggerTemplate';

export { createTriggerTemplateAction };

// Export a function to get all custom actions
export function getCustomActions(options: {
  config: any;
  catalogClient: any;
}) {
  return [
    createTriggerTemplateAction(options),
    // Add more custom actions here
  ];
}
```

### Step 6: Create Module Export

Create `src/index.ts`:

```typescript
export { getCustomActions, createTriggerTemplateAction } from './actions';
```

### Step 7: Build the Plugin

```bash
# Build the plugin
yarn build

# Output should be in dist/ directory
ls -la dist/
```

## Registering the Custom Action

### Method 1: Direct Registration (Development)

Create `src/scaffolder-plugin.ts` in your RHDH backend:

```typescript
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderBackend } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { getCustomActions } from 'scaffolder-backend-module-custom-actions';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });

  // Get custom actions
  const customActions = getCustomActions({
    config: env.config,
    catalogClient: catalogClient,
  });

  return await ScaffolderBackend.create({
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
    permissions: env.permissions,
    // Register custom actions
    additionalActions: customActions,
  });
}
```

### Method 2: Dynamic Plugin (Recommended for RHDH)

Create a dynamic plugin configuration in `app-config.yaml`:

```yaml
dynamicPlugins:
  rootDirectory: dynamic-plugins
  plugins:
    - package: 'scaffolder-backend-module-custom-actions'
      disabled: false
      pluginConfig:
        # Plugin-specific configuration
```

Create `dynamic-plugins-config.yaml`:

```yaml
plugins:
  - name: scaffolder-backend-module-custom-actions
    version: 1.0.0
    platform: node
    pluginType: backend
    actions:
      - trigger:template
```

## Using the Custom Action in Templates

Now you can use your custom action in scaffolder templates!

### Template 1: Main Template (Triggers Template 2)

Create `examples/templates/template-1/template.yaml`:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: template-1-main
  title: Main Application Template
  description: Creates a main application and triggers dependent service creation
  tags:
    - nodejs
    - microservice
spec:
  owner: platform-team
  type: service
  
  parameters:
    - title: Application Details
      required:
        - name
        - description
      properties:
        name:
          title: Application Name
          type: string
          description: Name of the application
          ui:autofocus: true
        description:
          title: Description
          type: string
          description: Description of the application
        createDependentService:
          title: Create Dependent Service
          type: boolean
          description: Should we create a dependent microservice?
          default: true
    
    - title: Repository Configuration
      required:
        - repoUrl
      properties:
        repoUrl:
          title: Repository Location
          type: string
          ui:field: RepoUrlPicker
          ui:options:
            allowedHosts:
              - github.com

  steps:
    - id: fetch-base
      name: Fetch Base Template
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
    
    - id: publish-main
      name: Publish Main Application
      action: publish:github
      input:
        repoUrl: ${{ parameters.repoUrl }}
        description: ${{ parameters.description }}
        defaultBranch: main
    
    - id: trigger-dependent-service
      name: Trigger Dependent Service Creation
      if: ${{ parameters.createDependentService }}
      action: trigger:template
      input:
        templateRef: template:default/template-2-service
        values:
          name: ${{ parameters.name }}-service
          description: Dependent service for ${{ parameters.name }}
          parentApp: ${{ parameters.name }}
          repoUrl: github.com?owner=your-org&repo=${{ parameters.name }}-service
        waitForCompletion: false
    
    - id: register-main
      name: Register Main Application
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps['publish-main'].output.repoContentsUrl }}
        catalogInfoPath: '/catalog-info.yaml'
  
  output:
    links:
      - title: Repository
        url: ${{ steps['publish-main'].output.remoteUrl }}
      - title: Open in catalog
        icon: catalog
        entityRef: ${{ steps['register-main'].output.entityRef }}
      - title: Dependent Service Task
        url: ${{ steps['trigger-dependent-service'].output.taskUrl }}
        condition: ${{ parameters.createDependentService }}
```

### Template 2: Dependent Service Template

Create `examples/templates/template-2/template.yaml`:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: template-2-service
  title: Dependent Service Template
  description: Creates a microservice (can be triggered from other templates)
  tags:
    - nodejs
    - microservice
    - dependent
spec:
  owner: platform-team
  type: service
  
  parameters:
    - title: Service Details
      required:
        - name
        - description
      properties:
        name:
          title: Service Name
          type: string
          description: Name of the service
        description:
          title: Description
          type: string
          description: Description of the service
        parentApp:
          title: Parent Application
          type: string
          description: Name of the parent application (if triggered from another template)
          ui:widget: hidden
    
    - title: Repository Configuration
      required:
        - repoUrl
      properties:
        repoUrl:
          title: Repository Location
          type: string
          ui:field: RepoUrlPicker
          ui:options:
            allowedHosts:
              - github.com

  steps:
    - id: fetch-base
      name: Fetch Service Template
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
          parentApp: ${{ parameters.parentApp }}
    
    - id: publish-service
      name: Publish Service
      action: publish:github
      input:
        repoUrl: ${{ parameters.repoUrl }}
        description: ${{ parameters.description }}
        defaultBranch: main
    
    - id: register-service
      name: Register Service
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps['publish-service'].output.repoContentsUrl }}
        catalogInfoPath: '/catalog-info.yaml'
  
  output:
    links:
      - title: Repository
        url: ${{ steps['publish-service'].output.remoteUrl }}
      - title: Open in catalog
        icon: catalog
        entityRef: ${{ steps['register-service'].output.entityRef }}
```

### Template Skeleton Files

Create `examples/templates/template-1/skeleton/catalog-info.yaml`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${{ values.name }}
  description: ${{ values.description }}
  annotations:
    github.com/project-slug: ${{ values.destination.owner }}/${{ values.destination.repo }}
spec:
  type: service
  lifecycle: experimental
  owner: platform-team
```

Create `examples/templates/template-1/skeleton/README.md`:

```markdown
# ${{ values.name }}

${{ values.description }}

## Getting Started

This application was created using RHDH Scaffolder.

## Development

```bash
npm install
npm start
```

## Deployment

See deployment documentation.
```

## Testing Your Custom Action

### Step 1: Create a Test Script

Create `test/test-action.ts`:

```typescript
import { createTriggerTemplateAction } from '../src/actions/triggerTemplate';
import { CatalogClient } from '@backstage/catalog-client';
import { ConfigReader } from '@backstage/config';

async function testTriggerAction() {
  // Mock configuration
  const config = new ConfigReader({
    backend: {
      baseUrl: 'http://localhost:7007',
    },
  });
  
  // Mock catalog client
  const catalogClient = new CatalogClient({
    discoveryApi: {
      async getBaseUrl() {
        return 'http://localhost:7007/api/catalog';
      },
    },
  });
  
  // Create the action
  const action = createTriggerTemplateAction({ config, catalogClient });
  
  console.log('Action created:', action.id);
  console.log('Action schema:', JSON.stringify(action.schema, null, 2));
  
  // You can add more tests here
}

testTriggerAction().catch(console.error);
```

### Step 2: Integration Test with RHDH

1. **Add template to catalog**:

```bash
# In RHDH UI, go to Create
# Register a new template location
# URL: file:///path/to/examples/templates/template-1/template.yaml
```

2. **Use the template**:
   - Navigate to "Create" in RHDH
   - Select "Main Application Template"
   - Fill in the form
   - Check "Create Dependent Service"
   - Submit

3. **Verify**:
   - Check that Template 1 completes
   - Verify Template 2 is triggered
   - Check task logs in RHDH

### Step 3: Manual API Test

```bash
# Test triggering a template via API
curl -X POST http://localhost:7007/api/scaffolder/v2/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "templateRef": "template:default/template-2-service",
    "values": {
      "name": "test-service",
      "description": "Test service",
      "repoUrl": "github.com?owner=test&repo=test-service"
    }
  }'
```

## Deployment

### Containerizing the Custom Action

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy built files
COPY dist ./dist

# The plugin will be loaded by RHDH
CMD ["echo", "Custom actions plugin ready"]
```

Build and push:

```bash
# Build container
podman build -t custom-actions:latest .

# Tag for registry
podman tag custom-actions:latest quay.io/your-org/custom-actions:latest

# Push to registry
podman push quay.io/your-org/custom-actions:latest
```

### Deploying to RHDH Container

Update your RHDH deployment to include the custom actions:

```bash
# Run RHDH with custom actions volume
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  -v ~/rhdh-custom-actions/dist:/opt/app-root/src/custom-actions:Z \
  -e NODE_PATH=/opt/app-root/src/custom-actions:$NODE_PATH \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

### Using in Production (OpenShift/Kubernetes)

Create a ConfigMap for the custom actions:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: custom-scaffolder-actions
  namespace: rhdh
data:
  actions.js: |
    # Your built custom actions code
```

Update RHDH deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rhdh
  namespace: rhdh
spec:
  template:
    spec:
      containers:
        - name: rhdh
          image: quay.io/rhdh/rhdh-hub-rhel9:latest
          volumeMounts:
            - name: custom-actions
              mountPath: /opt/app-root/src/custom-actions
      volumes:
        - name: custom-actions
          configMap:
            name: custom-scaffolder-actions
```

## Advanced Examples

### Trigger Multiple Templates in Sequence

```yaml
steps:
  - id: trigger-database
    name: Create Database
    action: trigger:template
    input:
      templateRef: template:default/database-template
      values:
        name: ${{ parameters.name }}-db
      waitForCompletion: true
  
  - id: trigger-api
    name: Create API Service
    action: trigger:template
    input:
      templateRef: template:default/api-template
      values:
        name: ${{ parameters.name }}-api
        databaseUrl: ${{ steps['trigger-database'].output.databaseUrl }}
      waitForCompletion: true
  
  - id: trigger-frontend
    name: Create Frontend
    action: trigger:template
    input:
      templateRef: template:default/frontend-template
      values:
        name: ${{ parameters.name }}-ui
        apiUrl: ${{ steps['trigger-api'].output.apiUrl }}
      waitForCompletion: false
```

### Conditional Template Triggering

```yaml
steps:
  - id: trigger-monitoring
    name: Setup Monitoring
    if: ${{ parameters.enableMonitoring }}
    action: trigger:template
    input:
      templateRef: template:default/monitoring-template
      values:
        appName: ${{ parameters.name }}
        
  - id: trigger-cicd
    name: Setup CI/CD
    if: ${{ parameters.environment === 'production' }}
    action: trigger:template
    input:
      templateRef: template:default/cicd-template
      values:
        appName: ${{ parameters.name }}
        environment: production
```

## Troubleshooting

### Action Not Found

**Issue**: Custom action not recognized in templates

**Solution**:
1. Verify action is registered:
   ```typescript
   console.log('Registered actions:', scaffolder.listActions());
   ```
2. Check action ID matches template usage
3. Rebuild and restart RHDH

### Template Trigger Fails

**Issue**: Template triggering returns error

**Checks**:
1. Verify template exists in catalog
2. Check template reference format
3. Validate input values match template parameters
4. Check RHDH logs:
   ```bash
   podman logs rhdh | grep -A 20 "trigger:template"
   ```

### Permission Errors

**Issue**: Not authorized to trigger template

**Solution**: Update app-config.yaml:

```yaml
permission:
  enabled: true
  policy:
    - allow:
        - resource: scaffolder-template
          action: create
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Logging**: Use `ctx.logger` extensively for debugging
3. **Validation**: Validate inputs using Zod schemas
4. **Async Operations**: Use `waitForCompletion` for dependent workflows
5. **Testing**: Test actions in isolation before integration
6. **Documentation**: Document your custom actions clearly
7. **Version Control**: Version your custom actions properly
8. **Security**: Validate and sanitize all inputs

## Additional Resources

- [Backstage Scaffolder Actions](https://backstage.io/docs/features/software-templates/builtin-actions)
- [Creating Custom Actions](https://backstage.io/docs/features/software-templates/writing-custom-actions)
- [RHDH Documentation](https://access.redhat.com/documentation/en-us/red_hat_developer_hub)
- [Example Custom Actions](../examples/custom-actions/)

## Next Steps

- Implement additional custom actions (e.g., database setup, notification)
- Create a library of reusable templates
- Set up CI/CD for custom actions
- Integrate with your organization's tools and processes
