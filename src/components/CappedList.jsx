import { CHAPTER_LIST_CAP } from "../lib/constants.js";

/**
 * A plain list that renders at most `cap` rows and says how many were left out,
 * so a huge month never floods the DOM.
 */
export default function CappedList({ items, formatter, cap = CHAPTER_LIST_CAP }) {
  if (!items.length) {
    return <p className="text-inkSoft text-sm">Nothing recorded.</p>;
  }
  return (
    <>
      <ul className="list-none m-0 p-0 text-sm">
        {items.slice(0, cap).map((item, i) => (
          <li key={i} className="py-1 border-b border-dashed border-line font-mono text-xs last:border-b-0">
            {formatter(item)}
          </li>
        ))}
      </ul>
      {items.length > cap && <p className="text-inkSoft text-xs mt-1.5">+ {items.length - cap} more not shown here.</p>}
    </>
  );
}
