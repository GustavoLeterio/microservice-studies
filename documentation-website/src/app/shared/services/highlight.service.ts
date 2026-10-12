import { Injectable } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import json from 'highlight.js/lib/languages/json';
import properties from 'highlight.js/lib/languages/properties';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import { CodeLanguage } from '../models/doc.models';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('java', java);
hljs.registerLanguage('json', json);
hljs.registerLanguage('properties', properties);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

const LABELS: Record<CodeLanguage, string> = {
  java: 'Java',
  yaml: 'YAML',
  xml: 'XML',
  dockerfile: 'Dockerfile',
  bash: 'Shell',
  json: 'JSON',
  ini: '.env',
  properties: 'Properties',
  text: 'Texto',
};

@Injectable({ providedIn: 'root' })
export class HighlightService {
  highlight(code: string, language: CodeLanguage): string {
    if (language === 'text') {
      return escapeHtml(code);
    }
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  }

  label(language: CodeLanguage): string {
    return LABELS[language];
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
