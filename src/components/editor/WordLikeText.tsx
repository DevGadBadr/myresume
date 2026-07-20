'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';

interface WordLikeTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  /** When true, Enter inserts a hard line break instead of a new paragraph. */
  hardBreakOnEnter?: boolean;
}

function textToDoc(value: string) {
  const lines = value.split('\n');
  if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };
  }

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: lines.flatMap((line, index) => {
          const nodes: Array<Record<string, unknown>> = [];
          if (line) {
            nodes.push({ type: 'text', text: line });
          }
          if (index < lines.length - 1) {
            nodes.push({ type: 'hardBreak' });
          }
          return nodes;
        }),
      },
    ],
  };
}

function docToText(json: {
  content?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}) {
  const paragraphs = json.content ?? [];
  return paragraphs
    .map((paragraph) => {
      if (!paragraph.content) return '';
      return paragraph.content
        .map((node) => {
          if (node.type === 'hardBreak') return '\n';
          return node.text ?? '';
        })
        .join('');
    })
    .join('\n');
}

const HardBreakOnEnter = Extension.create({
  name: 'hardBreakOnEnter',
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.setHardBreak(),
    };
  },
});

export default function WordLikeText({
  value,
  onChange,
  className = '',
  placeholder = 'Click to edit...',
  hardBreakOnEnter = true,
}: WordLikeTextProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
      }),
      Placeholder.configure({ placeholder }),
      ...(hardBreakOnEnter ? [HardBreakOnEnter] : []),
    ],
    content: textToDoc(value),
    editorProps: {
      attributes: {
        class: `word-like-editor outline-none w-full min-w-0 ${className}`,
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(docToText(current.getJSON() as Parameters<typeof docToText>[0]));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = docToText(editor.getJSON() as Parameters<typeof docToText>[0]);
    if (current !== value) {
      editor.commands.setContent(textToDoc(value), { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <p className={className}>{value}</p>;
  }

  return <EditorContent editor={editor} />;
}
