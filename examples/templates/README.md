# RHDH Template Examples

This directory contains example scaffolder templates for Red Hat Developer Hub (RHDH), demonstrating how to use custom actions including template triggering.

## Templates

### Template 1: Main Application Template

**Location:** `template-1/template.yaml`

**Description:** Creates a main application and optionally triggers the creation of a dependent service using the custom `trigger:template` action.

**Features:**
- Creates a Node.js application
- Publishes to GitHub
- Registers in RHDH catalog
- Optionally triggers Template 2 for dependent service

**Usage:**
1. Navigate to "Create" in RHDH
2. Select "Main Application Template"
3. Fill in application details
4. Choose whether to create dependent service
5. Submit

### Template 2: Dependent Service Template

**Location:** `template-2/template.yaml`

**Description:** Creates a microservice that can be used standalone or triggered from another template.

**Features:**
- Creates a microservice
- Can be triggered from Template 1
- Includes parent application reference
- Publishes to GitHub
- Registers in RHDH catalog

**Usage:**

**Standalone:**
1. Navigate to "Create" in RHDH
2. Select "Dependent Service Template"
3. Fill in service details
4. Submit

**Triggered from Template 1:**
- Automatically triggered when creating an application with Template 1
- Receives values from parent template

## Template Structure

Each template follows this structure:

```
template-X/
├── template.yaml          # Template definition
├── skeleton/              # Template files
│   ├── catalog-info.yaml # Backstage catalog definition
│   ├── README.md         # Generated README
│   └── package.json      # Package configuration
└── README.md             # Template documentation
```

## Registering Templates in RHDH

### Method 1: Via UI

1. Navigate to RHDH UI
2. Go to "Create" → "Register Existing Component"
3. Enter template URL:
   - Template 1: `file:///path/to/examples/templates/template-1/template.yaml`
   - Template 2: `file:///path/to/examples/templates/template-2/template.yaml`
4. Click "Analyze" and then "Import"

### Method 2: Via app-config.yaml

Add to your `app-config.yaml`:

```yaml
catalog:
  locations:
    # Template 1
    - type: file
      target: /path/to/examples/templates/template-1/template.yaml
      rules:
        - allow: [Template]
    
    # Template 2
    - type: file
      target: /path/to/examples/templates/template-2/template.yaml
      rules:
        - allow: [Template]
```

### Method 3: From GitHub

If templates are in a GitHub repository:

```yaml
catalog:
  locations:
    - type: url
      target: https://github.com/your-org/rhdh/blob/main/examples/templates/template-1/template.yaml
      rules:
        - allow: [Template]
    
    - type: url
      target: https://github.com/your-org/rhdh/blob/main/examples/templates/template-2/template.yaml
      rules:
        - allow: [Template]
```

## Using Templates with Podman

If running RHDH in Podman, mount the templates directory:

```bash
podman run -d \
  --name rhdh \
  -p 7007:7007 \
  -v ~/rhdh-config/app-config.yaml:/opt/app-root/src/app-config.yaml:Z \
  -v $(pwd)/examples/templates:/opt/app-root/src/templates:Z \
  quay.io/rhdh/rhdh-hub-rhel9:latest
```

Then use file paths in your catalog configuration:

```yaml
catalog:
  locations:
    - type: file
      target: /opt/app-root/src/templates/template-1/template.yaml
```

## Customizing Templates

### Modifying Template Parameters

Edit the `parameters` section in `template.yaml`:

```yaml
parameters:
  - title: My Section
    required:
      - myField
    properties:
      myField:
        title: My Field
        type: string
        description: Description of the field
```

### Adding Steps

Add new steps to the `steps` section:

```yaml
steps:
  - id: my-step
    name: My Custom Step
    action: my:custom:action
    input:
      param1: ${{ parameters.myField }}
```

### Customizing Skeleton Files

Modify files in the `skeleton/` directory. Use template variables:

- `${{ values.name }}` - Parameter values
- `${{ values.description }}` - Parameter values
- `{% if values.condition %}...{% endif %}` - Conditional blocks

## Template Workflow: Template 1 → Template 2

When using Template 1 with the "Create Dependent Service" option:

1. **Template 1 Executes:**
   - Fetches skeleton files
   - Publishes main application to GitHub
   - Registers in catalog
   
2. **Custom Action Triggers:**
   - `trigger:template` action is called
   - Template 2 reference is passed
   - Values are provided to Template 2
   
3. **Template 2 Executes:**
   - Runs as a separate task
   - Receives values from Template 1
   - Creates dependent service
   - Links to parent application

4. **Results:**
   - Main application is created
   - Dependent service is created
   - Both are registered in catalog
   - Dependency relationship is established

## Testing Templates

### 1. Validate YAML

```bash
# Install yamllint
pip install yamllint

# Validate template
yamllint template-1/template.yaml
yamllint template-2/template.yaml
```

### 2. Test Template Variables

Create a test values file:

```yaml
# test-values.yaml
name: test-app
description: Test application
repoUrl: github.com?owner=test&repo=test-app
```

### 3. Dry Run

Use the RHDH CLI or API to test without executing:

```bash
# Using curl
curl -X POST http://localhost:7007/api/scaffolder/v2/tasks \
  -H "Content-Type: application/json" \
  -d @test-task.json
```

## Troubleshooting

### Template Not Appearing

- Check catalog logs for errors
- Verify file path is correct
- Ensure YAML is valid
- Check permissions on template files

### Template Execution Fails

- Review task logs in RHDH UI
- Check action inputs are correct
- Verify GitHub token has correct permissions
- Check custom actions are registered

### Trigger Action Not Working

- Verify custom action is installed
- Check Template 2 reference is correct
- Review action logs for errors
- Ensure Template 2 is registered in catalog

## Best Practices

1. **Use Descriptive Names:** Make template and parameter names clear
2. **Validate Inputs:** Use patterns and validation for parameters
3. **Document Templates:** Include descriptions and help text
4. **Test Thoroughly:** Test templates with various inputs
5. **Version Control:** Keep templates in Git
6. **Modular Design:** Break complex workflows into multiple templates
7. **Error Handling:** Include appropriate error messages
8. **Security:** Validate and sanitize all inputs

## Additional Examples

For more template examples:
- [Backstage Template Gallery](https://backstage.io/docs/features/software-templates/template-gallery)
- [RHDH Documentation](https://access.redhat.com/documentation/en-us/red_hat_developer_hub)

## Documentation

- [Custom Scaffolder Actions Guide](../../docs/custom-scaffolder-actions.md)
- [Local Setup Guide](../../docs/local-setup-guide.md)
- [Main README](../../README.md)

## Contributing

To contribute new templates:
1. Create a new template directory
2. Follow the existing structure
3. Test thoroughly
4. Document usage
5. Submit a pull request
