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
