import { createTriggerTemplateAction } from './triggerTemplate';

export { createTriggerTemplateAction };

/**
 * Export a function to get all custom actions
 */
export function getCustomActions(options: {
  config: any;
  catalogClient: any;
}) {
  return [
    createTriggerTemplateAction(options),
    // Add more custom actions here as you create them
  ];
}
