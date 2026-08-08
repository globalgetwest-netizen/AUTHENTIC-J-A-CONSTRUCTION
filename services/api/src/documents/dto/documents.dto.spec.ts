import { describe, expect, it } from 'vitest';
import { validate } from 'class-validator';
import { CreateDocumentDto } from './documents.dto';

async function urlErrors(url: string | undefined): Promise<string[]> {
  const dto = new CreateDocumentDto();
  dto.title = 'Contract';
  if (url !== undefined) dto.url = url;
  const errors = await validate(dto);
  return errors.flatMap((e) => (e.property === 'url' ? (e.constraints ? Object.values(e.constraints) : []) : []));
}

describe('document url validation', () => {
  it('accepts an http(s) link', async () => {
    expect(await urlErrors('https://example.com/contracts/a.pdf')).toEqual([]);
    expect(await urlErrors('http://intranet.local/spec.docx')).toEqual([]);
  });

  it('accepts a server-relative path', async () => {
    expect(await urlErrors('/uploads/documents/a.pdf')).toEqual([]);
  });

  it('rejects javascript:, data: and other inert-breaking schemes', async () => {
    expect(await urlErrors('javascript:alert(1)')).not.toEqual([]);
    expect(await urlErrors('data:text/html,<script>1</script>')).not.toEqual([]);
    expect(await urlErrors('ftp://example.com/a.pdf')).not.toEqual([]);
  });

  it('rejects protocol-relative URLs (//host)', async () => {
    expect(await urlErrors('//evil.example/steal')).not.toEqual([]);
  });

  it('rejects a missing scheme entirely', async () => {
    expect(await urlErrors('example.com/a.pdf')).not.toEqual([]);
  });
});
