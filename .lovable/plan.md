

# Fix: "Invalid URL" nell'analisi foto render

## Problema
In `RenderNew.tsx`, la funzione `runPhotoAnalysis` cerca il prefisso `/storage/v1/object/public/render-originals/` nell'URL, ma il bucket `render-originals` è privato, quindi l'URL firmato usa il percorso `/storage/v1/object/sign/render-originals/`. Il match fallisce e viene lanciato `"Invalid URL"`.

Lo stesso problema potrebbe esistere in altri moduli render. Da verificare.

## Soluzione

### File: `src/pages/app/RenderNew.tsx`
Nella funzione `runPhotoAnalysis` (riga ~190), invece di estrarre il path dal URL e ricreare un signed URL (ridondante, dato che l'URL è già firmato), passare direttamente il signed URL alla Edge Function `analyze-window-photo`. Il signed URL è già valido e accessibile.

Semplificare la funzione:
```ts
const runPhotoAnalysis = async (signedUrl: string) => {
  setAnalysisLoading(true);
  setAnalysisError("");
  try {
    const { data, error } = await supabase.functions.invoke("analyze-window-photo", {
      body: { image_url: signedUrl },
    });
    if (error) throw error;
    const payload = (data?.data ?? data) as Record<string, unknown>;
    if (payload?.analysis) {
      setAnalysisData(payload.analysis as FotoAnalisi);
    }
  } catch (err: any) {
    setAnalysisError("Analisi non riuscita. Puoi comunque procedere manualmente.");
    console.error("Analysis error:", err);
  } finally {
    setAnalysisLoading(false);
  }
};
```

L'URL passato a `runPhotoAnalysis` dal chiamante `goToStep1` è già un signed URL valido per 1 anno. Non serve estrarre il path e rifirmarlo.

## File da modificare
- `src/pages/app/RenderNew.tsx` — semplificare `runPhotoAnalysis`

