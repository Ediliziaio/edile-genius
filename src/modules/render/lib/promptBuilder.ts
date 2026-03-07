export interface RenderConfig {
  materiale?: string;
  colore?: string;
  stile?: string;
  vetro?: string;
  oscurante?: string;
  ante?: number;
  note?: string;
  // prompt fragments from presets
  fragments: {
    materiale?: string;
    colore?: string;
    stile?: string;
    vetro?: string;
    oscurante?: string;
  };
}

export function buildRenderPrompt(config: RenderConfig, provider: string): {
  system: string;
  user: string;
  negative: string;
} {
  const parts: string[] = [];

  if (config.fragments.materiale) parts.push(config.fragments.materiale);
  if (config.fragments.colore) parts.push(config.fragments.colore);
  if (config.fragments.stile) parts.push(config.fragments.stile);
  if (config.fragments.vetro) parts.push(config.fragments.vetro);
  if (config.fragments.oscurante && config.fragments.oscurante !== "no shutters or blinds") {
    parts.push(config.fragments.oscurante);
  }
  if (config.ante && config.ante > 1) parts.push(`${config.ante}-panel window`);
  if (config.note) parts.push(config.note);

  const windowDesc = parts.join(", ");

  const system = `You are an expert architectural visualization AI. Your task is to replace the existing windows/doors in a building photograph with new ones while maintaining photorealistic quality. Keep the building structure, surroundings, lighting, and perspective exactly the same. Only replace the window/door frames and glass.`;

  const user = `Replace all visible windows in this photograph with: ${windowDesc}. Maintain exact same perspective, lighting conditions, wall texture, and surroundings. The result must look like a real photograph, not a rendering. Keep shadows consistent with the existing light direction.`;

  const negative = `cartoon, illustration, sketch, drawing, watermark, text overlay, blurry, distorted perspective, different building, changed wall color, unrealistic lighting`;

  return { system, user, negative };
}

export function validatePhoto(file: File): { valid: boolean; error?: string } {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "Formato non supportato. Usa JPG, PNG o WebP." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: "File troppo grande. Massimo 20MB." };
  }
  if (file.size < 10 * 1024) {
    return { valid: false, error: "File troppo piccolo. Carica una foto di qualità." };
  }
  return { valid: true };
}

export async function checkImageDimensions(file: File): Promise<{ width: number; height: number; valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width < 600 || img.height < 600) {
        resolve({ width: img.width, height: img.height, valid: false, error: `Risoluzione troppo bassa (${img.width}×${img.height}). Minimo 600×600px.` });
      } else {
        resolve({ width: img.width, height: img.height, valid: true });
      }
    };
    img.onerror = () => resolve({ width: 0, height: 0, valid: false, error: "Impossibile leggere l'immagine." });
    img.src = URL.createObjectURL(file);
  });
}
