import WaterShutdownList from "@/components/pages/watershutdown/WaterShutdownList"

export default function WaterShutdownPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'watershutdown/list/page.tsx:7',message:'Page component rendered',data:{route:'/watershutdown/list'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'watershutdown/list/page.tsx:10',message:'Before rendering WaterShutdownList',data:{componentExists:typeof WaterShutdownList !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return <WaterShutdownList />
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'watershutdown/list/page.tsx:15',message:'Error rendering page',data:{error:error instanceof Error ? error.message : String(error),stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}
