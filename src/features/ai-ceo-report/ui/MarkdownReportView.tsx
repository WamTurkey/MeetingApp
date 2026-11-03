import { cn } from "@/shared/lib/cn";

interface MarkdownReportViewProps {
  markdown: string;
  className?: string;
}

type Block =
  | { type: "heading"; level: 1 | 2; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  }

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,2})\s+(.+)$/.exec(trimmed);
    if (heading?.[1] && heading[2]) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1].length === 1 ? 1 : 2,
        text: heading[2].trim(),
      });
      continue;
    }

    const bullet = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (bullet?.[1]) {
      flushParagraph();
      listItems.push(bullet[1].trim());
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function MarkdownReportView({ markdown, className }: MarkdownReportViewProps) {
  const blocks = parseBlocks(markdown);

  return (
    <div className={cn("space-y-4 text-sm leading-relaxed text-surface-800 dark:text-surface-100", className)}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <div
              key={`h-${index}`}
              className="rounded-[20px] border border-[#C8D5D1] bg-[#F4F7F6] px-4 py-3 dark:border-surface-700 dark:bg-surface-900/60"
            >
              <h3
                className={cn(
                  "font-semibold text-surface-900 dark:text-surface-50",
                  block.level === 1 ? "text-base" : "text-sm",
                )}
              >
                {block.text}
              </h3>
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={`l-${index}`} className="list-disc space-y-1.5 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`p-${index}`} className="whitespace-pre-wrap">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
