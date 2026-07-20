'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface WordLikeBulletListProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  className?: string;
  placeholder?: string;
}

function bulletsToDoc(bullets: string[]) {
  const items = bullets.length > 0 ? bullets : [''];
  return {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: items.map((bullet) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: bullet ? [{ type: 'text', text: bullet }] : [],
            },
          ],
        })),
      },
    ],
  };
}

function docToBullets(json: {
  content?: Array<{
    type?: string;
    content?: Array<{
      content?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    }>;
  }>;
}): string[] {
  const list = json.content?.find((node) => node.type === 'bulletList');
  if (!list?.content?.length) {
    return [''];
  }

  return list.content.map((item) => {
    const paragraph = item.content?.[0];
    if (!paragraph?.content) return '';
    return paragraph.content
      .map((node) => {
        if (node.type === 'hardBreak') return '\n';
        return node.text ?? '';
      })
      .join('');
  });
}

export default function WordLikeBulletList({
  bullets,
  onChange,
  className = '',
  placeholder = 'Describe your work… (Enter for new bullet)',
}: WordLikeBulletListProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: bulletsToDoc(bullets),
    editorProps: {
      attributes: {
        class: `word-like-bullets outline-none w-full min-w-0 text-xs text-gray-700 leading-relaxed ${className}`,
      },
    },
    onUpdate: ({ editor: current }) => {
      const next = docToBullets(current.getJSON() as Parameters<typeof docToBullets>[0]);
      // Avoid empty document collapsing to zero bullets permanently
      onChange(next.length === 0 ? [''] : next);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = docToBullets(editor.getJSON() as Parameters<typeof docToBullets>[0]);
    const same =
      current.length === bullets.length && current.every((item, index) => item === bullets[index]);
    if (!same) {
      editor.commands.setContent(bulletsToDoc(bullets), { emitUpdate: false });
    }
  }, [editor, bullets]);

  if (!editor) {
    return (
      <ul className={`mt-1.5 space-y-1 pl-3 ${className}`}>
        {bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-[var(--resume-accent)] mt-0.5 shrink-0">•</span>
            <span className="flex-1 leading-relaxed whitespace-pre-wrap">{bullet}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <EditorContent editor={editor} className="mt-1.5" />;
}
