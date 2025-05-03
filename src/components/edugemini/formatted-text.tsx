
"use client";

import React from 'react';

interface FormattedTextProps {
  text: string;
}

// Helper to sanitize HTML (basic)
const basicSanitize = (html: string): string => {
    // Remove script tags completely
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove event handlers like onclick, onerror etc.
    sanitized = sanitized.replace(/\s(on\w+)=(['"]?)(?:(?!\2).)*\2/gi, '');
    // Allow only specific safe tags and attributes (very basic example)
    // A proper sanitizer library like DOMPurify is recommended for production
    // This basic version allows common formatting tags.
    const allowedTags = /<\/?(strong|em|b|i|ul|ol|li|p|br|table|thead|tbody|tr|th|td|code|pre)(\s+[^>]*)?>/gi;
    sanitized = sanitized.replace(/<(?!\/?(strong|em|b|i|ul|ol|li|p|br|table|thead|tbody|tr|th|td|code|pre)\b)[^>]+>/gi, '');

    return sanitized;
}


// Helper to format text with potential markdown (simple version for bold, lists, tables)
export const FormattedText: React.FC<FormattedTextProps> = ({ text }) => {
  if (!text) return null;

  let currentHtml = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic

  // Improved list handling (detects both '-' and '*' lists)
  currentHtml = currentHtml.replace(/^([ \t]*)([*+-]|\d+\.)[ \t]+(.*)/gm, (match, indent, marker, content) => {
      const isOrdered = /^\d+\./.test(marker);
      const tag = isOrdered ? 'ol' : 'ul';
      // Basic indentation check - very simple, might need refinement
      const level = indent.length / 2; // Assuming 2 spaces per level
      return `<li data-level="${level}">${content.trim()}</li>`;
  });

  // Wrap consecutive list items in appropriate ul/ol tags
  currentHtml = currentHtml.replace(/(<li.*?>.*?<\/li>\s*)+/g, (match) => {
      const firstLi = match.match(/<li[^>]*>/);
      const isOrdered = firstLi && firstLi[0].includes('ol'); // A bit hacky way to check based on previous replace logic
      const tag = isOrdered ? 'ol' : 'ul';
      // Simple list wrapping - doesn't handle nested lists correctly yet
      return `<${tag} class="list-inside ${isOrdered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1">${match.trim()}</${tag}>`;
  });


  // Basic Markdown Table Support
  const lines = currentHtml.split('\n');
  let inTable = false;
  let tableHtml = '';
  let processedLines: string[] = [];
  let headerProcessed = false;

  lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const isSeparator = /^\s*\|?(\s*:?-+:?\s*\|)+$/.test(trimmedLine);
      const isTableRow = /^\s*\|.*\|/.test(trimmedLine);

      if (isTableRow && !isSeparator) {
          if (!inTable) {
              // Start of a potential table
              if (index + 1 < lines.length && /^\s*\|?(\s*:?-+:?\s*\|)+$/.test(lines[index + 1].trim())) {
                  inTable = true;
                  headerProcessed = false;
                  tableHtml = '<table class="w-full border-collapse border border-border my-4 text-sm">';
                  // Process current line as header?
                  tableHtml += '<thead><tr class="bg-muted">';
                   trimmedLine.split('|').slice(1, -1).forEach(cell => {
                       tableHtml += `<th class="border border-border px-3 py-1.5 text-left font-medium">${cell.trim()}</th>`;
                   });
                   tableHtml += '</tr></thead><tbody>';
                   headerProcessed = true;

              } else {
                   processedLines.push(line); // Not a table row
               }
          } else {
              // Inside a table, process as a body row
              tableHtml += '<tr class="border-t border-border">';
              trimmedLine.split('|').slice(1, -1).forEach(cell => {
                  tableHtml += `<td class="border border-border px-3 py-1.5">${cell.trim()}</td>`;
              });
              tableHtml += '</tr>';
          }
      } else if (isSeparator && inTable) {
          // Table separator line - already handled header, ignore this line
          // If header wasn't processed above, could process the line *before* this separator as header.
          if (!headerProcessed && index > 0 && /^\s*\|.*\|/.test(lines[index-1].trim())) {
              // This case needs more robust logic - currently header is processed when table *starts*
          }

      } else {
          // Not a table row or separator
          if (inTable) {
              // End of table
              tableHtml += '</tbody></table>';
              processedLines.push(tableHtml);
              inTable = false;
              tableHtml = '';
          }
          processedLines.push(line); // Add the non-table line
      }
  });

   // Close table if it was the last element
   if (inTable) {
       tableHtml += '</tbody></table>';
       processedLines.push(tableHtml);
   }

  currentHtml = processedLines.join('\n');

  // Wrap remaining lines in paragraphs, avoid wrapping lists/tables
  let finalHtml = '';
  let inListOrTable = false;
  currentHtml.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    const startsList = trimmedLine.startsWith('<ul') || trimmedLine.startsWith('<ol');
    const endsList = trimmedLine.endsWith('</ul>') || trimmedLine.endsWith('</ol>');
    const startsTable = trimmedLine.startsWith('<table');
    const endsTable = trimmedLine.endsWith('</table>');

    if (startsList || startsTable) {
        inListOrTable = true;
        finalHtml += line + '\n';
    } else if (endsList || endsTable) {
        inListOrTable = false;
        finalHtml += line + '\n';
    } else if (inListOrTable) {
         // Add lines within list/table directly (they should already have li/tr tags)
         finalHtml += line + '\n';
     } else if (trimmedLine) {
        // Wrap non-empty lines outside lists/tables in paragraphs
        finalHtml += `<p>${line}</p>\n`;
    } else {
         // Add a break for empty lines between paragraphs? Maybe not needed with CSS margin.
         // finalHtml += '<br />\n';
     }
  });


  const sanitizedHtml = basicSanitize(finalHtml.trim());

  // Use prose for better typography, adjust space-y as needed
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} className="prose prose-sm sm:prose-base max-w-none dark:prose-invert space-y-3" />;
};

    