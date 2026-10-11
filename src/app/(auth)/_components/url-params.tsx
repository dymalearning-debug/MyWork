"use client";

import { useEffect, useRef } from "react";

// Hidden fields carrying parameters of the page address (?next=…, ?type=…) into a form.
// Filled in the browser once the page has loaded: the page stays static and is never re-rendered,
// so nothing the visitor types can be lost, and the form keeps working before JavaScript has
// loaded (without these values then). The server validates them.
export function UrlParamInputs({ names }: { names: string[] }) {
  return names.map((name) => <UrlParamInput key={name} name={name} />);
}

function UrlParamInput({ name }: { name: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = new URLSearchParams(window.location.search).get(name) ?? "";
  }, [name]);
  return <input ref={ref} type="hidden" name={name} defaultValue="" />;
}
