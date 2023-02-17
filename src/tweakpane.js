import { Pane } from "tweakpane";
import { presets } from "./presets";

export function tp(params) {
  const pane = new Pane();

  const presetOptions = presets.map((p, i) => ({
    text: `Preset ${i + 1}`,
    value: i,
  }));

  // presets and export
  const presetsList = pane.addBlade({
    view: "list",
    label: "Presets",
    options: presetOptions,
    value: 0,
  });

  presetsList.on("change", (e) => {
    pane.importPreset({ ...params, ...presets[e.value] });
  });

  const exportButton = pane.addButton({
    title: "copy + console.log()",
    label: "Parameters",
  });

  exportButton.on("click", async () => {
    const p = JSON.stringify(pane.exportPreset());
    console.log(p);
    await navigator.clipboard.writeText(p);
  });

  pane.addSeparator();

  // monitors
  pane.addMonitor(params, "actualCellCount", {});
  pane.addSeparator();

  // core params
  pane.addInput(params, "cellCount", {
    min: 50,
    max: 1000,
    step: 1,
  });
  pane.addInput(params, "startCell", {
    min: 0,
    max: 50,
    step: 1,
  });
  pane.addInput(params, "cellAngle", {
    min: 100,
    max: 179,
    step: 1,
  });
  pane.addInput(params, "cellAngleFrac", {
    min: 0,
    max: 1,
    step: 0.1,
  });
  pane.addInput(params, "cellSize", {
    min: 6,
    max: 40,
    step: 1,
  });
  pane.addInput(params, "cellClipR", {
    min: 0,
    max: 100,
    step: 1,
  });
  pane.addSeparator();

  // debugging
  pane.addInput(params, "showCellClipCircles", { label: "Show Clip Circles" });
  pane.addInput(params, "showCellSites", { label: "Show Cell Sites" });
  pane.addInput(params, "showCellText", { label: "Show Cell Text" });
  pane.addInput(params, "textSize", {
    label: "Text Size",
    min: 8,
    max: 14,
    step: 0.25,
  });

  return pane;
}
