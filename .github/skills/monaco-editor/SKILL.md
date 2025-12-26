---
description: 'Monaco Editor skill - VS Code code editor for Angular with @ng-util/monaco-editor. For ng-lin construction site progress tracking system.'
---

# Monaco Editor - VS Code Code Editor

Trigger patterns: "Monaco", "code editor", "@ng-util/monaco-editor", "syntax highlighting", "IntelliSense"

## Overview

Monaco Editor is the code editor that powers VS Code, providing syntax highlighting, IntelliSense, and advanced editing features directly in the browser.

**Package**: @ng-util/monaco-editor@20.0.1  
**Wrapper**: Angular wrapper for microsoft/monaco-editor  
**Use Case**: Code editing, JSON editing, template editing in ng-lin

## Installation & Setup

### 1. Install Package

```bash
npm install @ng-util/monaco-editor@20.0.1
```

### 2. Configure Assets (angular.json)

```json
{
  "projects": {
    "ng-lin": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              {
                "glob": "**/*",
                "input": "node_modules/monaco-editor/min/vs",
                "output": "assets/monaco-editor/vs"
              }
            ]
          }
        }
      }
    }
  }
}
```

### 3. Global Configuration (Optional)

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideMonacoEditor } from '@ng-util/monaco-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideMonacoEditor({
      baseUrl: 'assets/monaco-editor',
      defaultOptions: {
        theme: 'vs-dark',
        automaticLayout: true
      }
    })
  ]
};
```

## Basic Usage

### Standalone Component Integration

```typescript
import { Component, signal } from '@angular/core';
import { MonacoEditorComponent } from '@ng-util/monaco-editor';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [MonacoEditorComponent],
  template: `
    <monaco-editor
      [value]="code()"
      [language]="'typescript'"
      [height]="'600px'"
      [theme]="'vs-dark'"
      (valueChange)="onCodeChange($event)"
    />
  `
})
export class CodeEditorComponent {
  code = signal(`function hello() {
  console.log('Hello, World!');
}`);
  
  onCodeChange(newCode: string): void {
    this.code.set(newCode);
    console.log('Code changed:', newCode);
  }
}
```

## Supported Languages

Common languages for ng-lin:

| Language | Use Case |
|----------|----------|
| `typescript` | TypeScript code editing |
| `javascript` | JavaScript code editing |
| `json` | Configuration files, API responses |
| `html` | HTML templates |
| `css`, `scss`, `less` | Stylesheets |
| `markdown` | Documentation, notes |
| `yaml` | Configuration files |
| `sql` | Database queries |
| `shell` | Shell scripts |

## Advanced Features

### 1. IntelliSense & Type Definitions

```typescript
import { Component, signal, ViewChild, AfterViewInit } from '@angular/core';
import { MonacoEditorComponent } from '@ng-util/monaco-editor';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'app-advanced-editor',
  standalone: true,
  imports: [MonacoEditorComponent],
  template: `
    <monaco-editor
      #editor
      [value]="code()"
      [language]="'typescript'"
      [height]="'600px'"
      [options]="editorOptions"
      (editorInit)="onEditorInit($event)"
    />
  `
})
export class AdvancedEditorComponent implements AfterViewInit {
  @ViewChild('editor') editorComponent!: MonacoEditorComponent;
  
  code = signal(`interface User {
  id: string;
  name: string;
}`);
  
  editorOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2
  };
  
  ngAfterViewInit(): void {
    // Editor is initialized
  }
  
  onEditorInit(editor: monaco.editor.IStandaloneCodeEditor): void {
    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React
    });
    
    // Add extra type definitions
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `declare module 'myLibrary' {
        export function doSomething(value: string): number;
      }`,
      'file:///node_modules/@types/myLibrary/index.d.ts'
    );
  }
}
```

### 2. Read-Only Mode

```typescript
@Component({
  template: `
    <monaco-editor
      [value]="code()"
      [language]="'typescript'"
      [options]="{ readOnly: true }"
    />
  `
})
```

### 3. Diff Editor (Compare)

```typescript
import { Component, signal } from '@angular/core';
import { MonacoDiffEditorComponent } from '@ng-util/monaco-editor';

@Component({
  selector: 'app-code-diff',
  standalone: true,
  imports: [MonacoDiffEditorComponent],
  template: `
    <monaco-diff-editor
      [original]="originalCode()"
      [modified]="modifiedCode()"
      [language]="'typescript'"
      [height]="'600px'"
    />
  `
})
export class CodeDiffComponent {
  originalCode = signal(`function hello() {
  console.log('Hello');
}`);
  
  modifiedCode = signal(`function hello() {
  console.log('Hello, World!');
}`);
}
```

## Real-World Examples

### JSON Configuration Editor

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { MonacoEditorComponent } from '@ng-util/monaco-editor';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-config-editor',
  standalone: true,
  imports: [MonacoEditorComponent],
  template: `
    <nz-card [nzTitle]="'配置編輯器'">
      <monaco-editor
        [value]="configJson()"
        [language]="'json'"
        [height]="'400px'"
        [options]="editorOptions"
        (valueChange)="onConfigChange($event)"
      />
      
      @if (errorMessage()) {
        <nz-alert
          [nzType]="'error'"
          [nzMessage]="errorMessage()!"
          style="margin-top: 16px;"
        />
      }
      
      <div style="margin-top: 16px;">
        <button
          nz-button
          nzType="primary"
          [disabled]="!isValidJson()"
          (click)="saveConfig()"
        >
          儲存配置
        </button>
      </div>
    </nz-card>
  `
})
export class ConfigEditorComponent {
  private messageService = inject(NzMessageService);
  
  // Configuration as JSON string
  configJson = signal(JSON.stringify({
    theme: 'dark',
    language: 'zh-TW',
    features: {
      notifications: true,
      autoSave: false
    }
  }, null, 2));
  
  errorMessage = signal<string | null>(null);
  
  editorOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    formatOnPaste: true,
    formatOnType: true
  };
  
  isValidJson = computed(() => {
    try {
      JSON.parse(this.configJson());
      return true;
    } catch {
      return false;
    }
  });
  
  onConfigChange(newJson: string): void {
    this.configJson.set(newJson);
    
    // Validate JSON
    try {
      JSON.parse(newJson);
      this.errorMessage.set(null);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Invalid JSON'
      );
    }
  }
  
  saveConfig(): void {
    if (!this.isValidJson()) return;
    
    try {
      const config = JSON.parse(this.configJson());
      // Save config...
      this.messageService.success('配置已儲存');
    } catch (error) {
      this.messageService.error('儲存失敗');
    }
  }
}
```

### Firestore Security Rules Editor

```typescript
import { Component, signal, inject, OnInit } from '@angular/core';
import { MonacoEditorComponent } from '@ng-util/monaco-editor';
import { FirestoreRulesService } from '@core/services/firestore-rules.service';

@Component({
  selector: 'app-rules-editor',
  standalone: true,
  imports: [MonacoEditorComponent],
  template: `
    <nz-card [nzTitle]="'Firestore Security Rules'">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else {
        <monaco-editor
          [value]="rules()"
          [language]="'javascript'"
          [height]="'600px'"
          [options]="editorOptions"
          (valueChange)="onRulesChange($event)"
        />
        
        <div style="margin-top: 16px;">
          <button
            nz-button
            nzType="primary"
            [nzLoading]="saving()"
            (click)="saveRules()"
          >
            部署規則
          </button>
        </div>
      }
    </nz-card>
  `
})
export class RulesEditorComponent implements OnInit {
  private rulesService = inject(FirestoreRulesService);
  
  rules = signal('');
  loading = signal(false);
  saving = signal(false);
  
  editorOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    language: 'javascript'
  };
  
  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const currentRules = await this.rulesService.getRules();
      this.rules.set(currentRules);
    } finally {
      this.loading.set(false);
    }
  }
  
  onRulesChange(newRules: string): void {
    this.rules.set(newRules);
  }
  
  async saveRules(): Promise<void> {
    this.saving.set(true);
    try {
      await this.rulesService.deployRules(this.rules());
      // Success notification
    } finally {
      this.saving.set(false);
    }
  }
}
```

## Best Practices

### 1. Use Signals for Reactive State

✅ **DO**:
```typescript
code = signal('');
isValid = computed(() => this.validateCode(this.code()));
```

❌ **DON'T**:
```typescript
code: string = '';
isValid: boolean = false;
ngOnChanges() { this.isValid = this.validateCode(this.code); }
```

### 2. Handle Large Files

✅ **DO**: Set size limits and lazy load
```typescript
@Component({
  template: `
    @if (fileSize() < 1_000_000) {
      <monaco-editor [value]="code()" />
    } @else {
      <nz-alert nzType="warning" nzMessage="檔案過大，請使用外部編輯器" />
    }
  `
})
```

### 3. Provide Validation Feedback

✅ **DO**: Show real-time validation
```typescript
onCodeChange(code: string): void {
  this.code.set(code);
  
  try {
    this.validate(code);
    this.errorMessage.set(null);
  } catch (error) {
    this.errorMessage.set(error.message);
  }
}
```

## Performance Tips

1. **Lazy Load**: Load Monaco only when needed
2. **Debounce Changes**: Use `debounceTime()` for valueChange
3. **Limit Editor Instances**: Reuse editors when possible
4. **Disable Minimap**: For small editors, disable minimap
5. **Set Fixed Heights**: Avoid dynamic height calculations

## Integration Checklist

- [ ] Install @ng-util/monaco-editor@20.0.1
- [ ] Configure assets in angular.json
- [ ] Set up global configuration (optional)
- [ ] Import MonacoEditorComponent
- [ ] Handle valueChange events
- [ ] Add validation for user input
- [ ] Set appropriate editor options
- [ ] Test with large files
- [ ] Handle loading states

## Anti-Patterns

❌ **Creating Multiple Editors for Same Content**:
```typescript
// Creates new editor on every change
@for (item of items(); track item.id) {
  <monaco-editor [value]="item.code" />
}
```

✅ **Single Editor with Dynamic Content**:
```typescript
<monaco-editor [value]="selectedItem()?.code" />
```

---

❌ **Not Handling Validation**:
```typescript
onCodeChange(code: string): void {
  this.code.set(code); // No validation
}
```

✅ **Validate Input**:
```typescript
onCodeChange(code: string): void {
  try {
    JSON.parse(code); // Validate if JSON
    this.code.set(code);
  } catch (error) {
    // Show error
  }
}
```

## Cross-References

- **angular-component** - Signals integration
- **delon-form** - Form integration for code fields
- **firebase-repository** - Store code/config in Firestore
- `.github/instructions/angular.instructions.md` - Angular 20 patterns

## Package Information

- **Version**: @ng-util/monaco-editor@20.0.1
- **Upstream**: monaco-editor@0.52.2
- **Repository**: https://github.com/ng-util/ng-util
- **Documentation**: https://microsoft.github.io/monaco-editor/

---

**Version**: 1.0  
**Created**: 2025-12-25  
**Maintainer**: GigHub Development Team
