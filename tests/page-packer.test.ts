import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlockStream } from '../src/lib/resume-blocks.ts';
import { mmToPx, packBlocksIntoPages, packResumeIntoPages } from '../src/lib/page-packer.ts';
import { pageContentHeightMm, resolvePageMargins } from '../src/lib/page-layout.ts';
import { DEFAULT_RESUME_DATA } from '../src/lib/defaultData.ts';
import { normalizeLayoutSettings } from '../src/lib/layout-settings.ts';

test('packBlocksIntoPages does not orphan projects heading at end of a page', () => {
  const data = {
    ...DEFAULT_RESUME_DATA,
    layout: normalizeLayoutSettings({
      controls: [
        {
          id: 'break-1',
          type: 'pageBreak',
          anchor: { kind: 'beforeSection', section: 'projects' },
        },
      ],
    }),
  };

  const blocks = buildBlockStream(data, data.layout!);
  const heights = new Map(blocks.map((block) => [block.id, mmToPx(12)]));
  const pages = packBlocksIntoPages(blocks, heights);

  for (const page of pages) {
    const ids = page.layout === 'cover' ? page.blockIds : page.blockIds;
    const lastId = ids[ids.length - 1];
    if (lastId === 'heading-projects') {
      assert.fail('projects section heading must not be the last block on a page');
    }
  }
});

test('packBlocksIntoPages respects page break before continuation content', () => {
  const data = {
    ...DEFAULT_RESUME_DATA,
    layout: normalizeLayoutSettings({
      controls: [
        {
          id: 'break-1',
          type: 'pageBreak',
          anchor: { kind: 'beforeSection', section: 'projects' },
        },
      ],
    }),
  };

  const blocks = buildBlockStream(data, data.layout!);
  const heights = new Map(blocks.map((block) => [block.id, mmToPx(10)]));
  const pages = packBlocksIntoPages(blocks, heights);

  assert.ok(pages.length >= 2);
  const projectsIndex = blocks.findIndex((block) => block.id === 'heading-projects');
  const projectPage = pages.find(
    (page) =>
      page.layout === 'continuation' && page.blockIds.includes(blocks[projectsIndex]?.id ?? '')
  );
  assert.ok(projectPage);
});

test('packBlocksIntoPages adds spacer height into page budget', () => {
  const data = {
    ...DEFAULT_RESUME_DATA,
    layout: normalizeLayoutSettings({
      controls: [
        {
          id: 'spacer-1',
          type: 'spacer',
          anchor: { kind: 'afterHeader' },
          heightMm: 40,
        },
      ],
    }),
  };

  const blocks = buildBlockStream(data, data.layout!);
  const heights = new Map(
    blocks.map((block) => [
      block.id,
      block.kind === 'spacer' ? 0 : mmToPx(20),
    ])
  );
  heights.set('spacer-spacer-1', mmToPx(40));

  const pages = packResumeIntoPages(data, heights, data.layout);
  const cover = pages[0];
  assert.equal(cover.layout, 'cover');
  assert.ok(cover.cover?.headerIds.includes('spacer-spacer-1'));
});

test('cover page uses max of left and right column heights', () => {
  const data = DEFAULT_RESUME_DATA;
  const blocks = buildBlockStream(data);
  const heights = new Map<string, number>();

  blocks.forEach((block) => {
    if (block.column === 'left') {
      heights.set(block.id, mmToPx(30));
    } else if (block.column === 'right') {
      heights.set(block.id, mmToPx(10));
    } else if (block.column === 'header') {
      heights.set(block.id, mmToPx(20));
    } else {
      heights.set(block.id, mmToPx(15));
    }
  });

  const pages = packBlocksIntoPages(blocks, heights);
  assert.equal(pages[0].layout, 'cover');
  assert.ok(pages[0].cover);
});

test('packResumeIntoPages uses layout page margins for content budget', () => {
  const data = DEFAULT_RESUME_DATA;
  const blocks = buildBlockStream(data);
  const heights = new Map(blocks.map((block) => [block.id, mmToPx(80)]));

  const defaultLayout = normalizeLayoutSettings(undefined);
  const tightLayout = normalizeLayoutSettings({
    pageMargins: { top: 40, bottom: 40, left: 12, right: 12 },
  });

  const defaultPages = packResumeIntoPages(data, heights, defaultLayout);
  const tightPages = packResumeIntoPages(data, heights, tightLayout);

  const defaultContentMm = pageContentHeightMm(resolvePageMargins(defaultLayout));
  const tightContentMm = pageContentHeightMm(resolvePageMargins(tightLayout));
  assert.ok(tightContentMm < defaultContentMm);
  assert.ok(tightPages.length > defaultPages.length);
});
