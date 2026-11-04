import { DocTest, TestModuleId, TestText } from './test.models';

export function docTest(
  id: string,
  moduleId: TestModuleId,
  className: string,
  method: string,
  summary: TestText,
  reason: TestText,
  code: string,
  file: string,
  anchor?: string,
): DocTest {
  return { id, anchor, moduleId, className, method, summary, reason, code, file };
}
