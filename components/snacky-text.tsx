import { Fragment } from "react";

// Snacky marks key numbers as **bold**; show those bold, the rest as text
export function SnackyInline({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, index) =>
    chunk.startsWith("**") && chunk.endsWith("**") ? (
      <strong key={index} className='font-semibold'>
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={index}>{chunk}</Fragment>
    ),
  );
}
