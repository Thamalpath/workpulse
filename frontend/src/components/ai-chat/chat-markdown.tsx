"use client";

import { Fragment } from "react";

function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]*`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-[#F1F4F9] px-1 py-0.5 text-[0.85em] text-[#4263A3]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function isListItem(line: string) {
  return /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);
}

export function ChatMarkdown({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = content.split("\n");
  let listBuffer: { ordered: boolean; items: string[] } | null = null;
  let paragraph: string[] = [];

  const flushList = () => {
    if (listBuffer) {
      const { ordered, items } = listBuffer;
      const itemsNodes = items.map((item, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="select-none text-[#4263A3]">
            {ordered ? `${i + 1}.` : "•"}
          </span>
          <span>{renderInline(item)}</span>
        </li>
      ));
      blocks.push(
        <ul
          key={`list-${blocks.length}`}
          className="list-none space-y-1.5"
        >
          {itemsNodes}
        </ul>,
      );
      listBuffer = null;
    }
  };

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="leading-relaxed">
          {renderInline(paragraph.join(" "))}
        </p>,
      );
      paragraph = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      flushList();
      flushParagraph();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushList();
      flushParagraph();
      const level = headingMatch[1].length;
      const size =
        level === 1
          ? "text-sm font-semibold"
          : level === 2
            ? "text-[13px] font-semibold"
            : "text-xs font-semibold";
      blocks.push(
        <p key={`h-${blocks.length}`} className={`${size} text-[#18202F]`}>
          {renderInline(headingMatch[2])}
        </p>,
      );
      continue;
    }

    if (isListItem(line)) {
      flushParagraph();
      const ordered = /^\d+\.\s+/.test(line);
      if (!listBuffer || listBuffer.ordered !== ordered) {
        flushList();
        listBuffer = { ordered, items: [] };
      }
      const itemText = line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
      listBuffer.items.push(itemText);
      continue;
    }

    if (listBuffer) {
      flushList();
    }
    paragraph.push(line.replace(/\*\*/g, ""));
  }

  flushList();
  flushParagraph();

  return <div className="space-y-2">{blocks}</div>;
}
