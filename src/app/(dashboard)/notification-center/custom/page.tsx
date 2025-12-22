"use client"

import CustomNotificationList from "@/components/pages/notification/CustomNotificationList"

export default function CustomNotificationPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'notification-center/custom/page.tsx:7',message:'CustomNotificationPage rendered',data:{route:'/notification-center/custom'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return <CustomNotificationList />
}
