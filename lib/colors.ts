import randomColor from 'randomcolor';

/**
 * Assign a color to a unique layer ID and also considering
 * common layer names such as water or wood.
 * @param {string} layerId
 * @return {string} Unique random for the layer ID
 */
function brightColor(layerId: string, alpha: string) {
  let luminosity: NonNullable<Parameters<typeof randomColor>[0]>["luminosity"] = 'bright';
  let hue: NonNullable<Parameters<typeof randomColor>[0]>["hue"] = undefined;

  if (/water|ocean|lake|sea|river/.test(layerId)) {
    hue = 'blue';
  }

  if (/state|country|place/.test(layerId)) {
    hue = 'pink';
  }

  if (/road|highway|transport|streets/.test(layerId)) {
    hue = 'orange';
  }

  if (/contour|building|earth/.test(layerId)) {
    hue = 'monochrome';
  }

  if (/building/.test(layerId)) {
    luminosity = 'dark';
  }

  if (/earth/.test(layerId)) {
    luminosity = 'light';
  }

  if (/contour|landuse/.test(layerId)) {
    hue = 'yellow';
  }

  if (/wood|forest|park|landcover|land|natural/.test(layerId)) {
    hue = 'green';
  }

  const rgb = randomColor({
    luminosity,
    hue,
    seed: layerId,
    format: 'rgbArray'
  }) as any as string[];

  return `rgba(${rgb.join(', ')}, ${alpha || "1"})`;
}

export default { brightColor };
