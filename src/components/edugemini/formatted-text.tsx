"use client";

import React from 'react';

interface FormattedTextProps {
  text: string;
}

// Helper to format text with potential markdown (simple version)
export const FormattedText: React.FC<FormattedTextProps> = ({ text }) => {
  // Basic markdown-like formatting for bold and lists
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/^- (.*)/gm, '<li style="margin-left: 1.5rem; list-style: disc;">$1</li>'); // List items

  // Split by newlines and wrap paragraphs, handling list context
  let html = '';
  let inList = false;
  formatted.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('<li')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += line; // Use original line to preserve potential indentation within li if needed later
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      // Add paragraph tags only if the line is not empty
      if (trimmedLine) {
       html += `<p>${line}</p>`; // Use original line to preserve potential leading/trailing spaces if significant
      } else if (html.length > 0 && !html.endsWith('<br />') && !html.endsWith('</p>')) {
        // Add a single break for empty lines between content, but not multiple or at the start/end
        // html += '<br />'; // Avoid adding <br/> for now, let CSS handle paragraph spacing
      }
    }
  });
  if (inList) {
    html += '</ul>'; // Close list if it's the last element
  }

  // Basic sanitization (very limited, consider a proper library for production)
  // This prevents basic script injection but is NOT foolproof.
  const sanitizedHtml = html.replace(/<script.*?>.*?<\/script>/gi, '');

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} className="space-y-2" />;
};
