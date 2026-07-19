"use client";

import { useState } from "react";
import { CLEAR_STEPS, RESOURCES, type ResourceItem } from "../training-data";

export function ResourcesPage({ onNotice }: { onNotice: (notice: string) => void }) {
  return (
    <div className="page standard-page resources-page">
      <header className="page-header">
        <p className="eyebrow">FIELD GUIDE</p>
        <h1>Keep the method close.</h1>
        <p>
          Copy a template, run a safety check, or refresh a CLEAR move whenever
          real work gets messy.
        </p>
      </header>

      <section className="clear-framework" aria-labelledby="framework-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE FIVE MOVES</p>
            <h2 id="framework-title">The CLEAR framework</h2>
          </div>
        </div>
        <div className="clear-framework-grid">
          {CLEAR_STEPS.map((step) => (
            <article key={step.key}>
              <span>{step.letter}</span>
              <h3>{step.name}</h3>
              <strong>{step.action}</strong>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resource-list" aria-labelledby="resource-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">REUSABLE TOOLS</p>
            <h2 id="resource-list-title">Ready when the work is</h2>
          </div>
        </div>
        {RESOURCES.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} onNotice={onNotice} />
        ))}
      </section>
    </div>
  );
}

function ResourceCard({
  resource,
  onNotice,
}: {
  resource: ResourceItem;
  onNotice: (notice: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="resource-card">
      <div className="resource-card-head">
        <span className="resource-kind">{resource.kind}</span>
        <div>
          <h3>{resource.title}</h3>
          <p>{resource.description}</p>
          <small>Use when: {resource.useWhen}</small>
        </div>
        <button
          className="button button-small button-quiet"
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Close" : "Open"}
        </button>
      </div>
      {open ? (
        <div className="resource-body">
          <div className="resource-sections">
            {resource.sections.map((section) => (
              <section key={section.heading}>
                <h4>{section.heading}</h4>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="copy-box">
            <pre>{resource.copyText}</pre>
            <button
              className="button button-dark button-small"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(resource.copyText);
                onNotice(`${resource.title} copied to the clipboard.`);
              }}
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
