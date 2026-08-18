import { createElement } from "react";
import { renderSubjectiveMarkup } from "@subjective-c/runtime/browser";

export function SubjectiveStatic({ state, className, ...props }) {
  if (!state?.manifest || !state?.variant) throw new TypeError("SubjectiveStatic requires manifest and variant state.");
  return createElement("div", {
    ...props,
    className,
    "data-subjective-react": "static",
    dangerouslySetInnerHTML: { __html: renderSubjectiveMarkup({ ...state, devtools: state.devtools ?? false }) }
  });
}
