import assert from "node:assert/strict";
import test from "node:test";
import { createAgentSectionDescentAssay } from "../src/assay.mjs";

const laplacian = () => ({ disagreementEnergy: 0 });
const sections = [
  { provider: "A", coordinate: "BLK:5", value: 0.12, confidence: 0.8 },
  { provider: "B", coordinate: "BLK:5", value: -0.07, confidence: 0.7 },
];

test("requires a separately supplied numeric disagreement provider", () => {
  assert.throws(() => createAgentSectionDescentAssay({}), /laplacian-measurement-provider-required/u);
  assert.throws(() => createAgentSectionDescentAssay({ measureSheafLaplacian: 1 }), /laplacian-measurement-provider-required/u);
});

test("refuses a lone agent's forecast instead of inventing multi-agent evidence", () => {
  const assay = createAgentSectionDescentAssay({ measureSheafLaplacian: laplacian });
  assert.throws(() => assay({ sections: [sections[0]] }), /plural-agent-sections-required/u);
});

test("refuses duplicate provider-coordinate reports before numeric aggregation", () => {
  let called = false;
  const assay = createAgentSectionDescentAssay({
    measureSheafLaplacian: () => { called = true; return laplacian(); },
  });
  assert.throws(() => assay({sections: [sections[0], {...sections[0], value: 0.13}]}), /duplicate-provider-coordinate-forecast/u);
  assert.equal(called, false);
});

test("confidence bounds and malformed cited evidence are not silently coerced", () => {
  const assay = createAgentSectionDescentAssay({ measureSheafLaplacian: laplacian });
  assert.throws(() => assay({ sections, confidenceFloor: 1.1 }), /confidence-floor-out-of-range/u);
  assert.throws(() => assay({ sections: [sections[0], {...sections[1], evidenceReferences: [""]}] }), /forecast-evidence-references-invalid/u);
  assert.throws(() => assay({ sections: [sections[0], {...sections[1], confidence: -0.1}] }), /forecast-confidence-out-of-range/u);
});
