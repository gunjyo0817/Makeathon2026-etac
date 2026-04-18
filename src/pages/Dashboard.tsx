import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricsRow } from "@/components/sales/MetricsRow";
import { ProductSelector } from "@/components/sales/ProductSelector";
import { CalendarPanel } from "@/components/sales/CalendarPanel";
import { PipelineBoard } from "@/components/sales/PipelineBoard";
import { ConversationAttentionPanel } from "@/components/sales/ConversationAttentionPanel";
import { conversationsNeedingAttention, leads, products } from "@/data/mock";

export default function Dashboard() {
  const [productId, setProductId] = useState(products[0].id);
  const filteredLeads = useMemo(() => leads.filter((l) => l.productId === productId), [productId]);
  const attentionItems = useMemo(
    () => conversationsNeedingAttention.filter((item) => item.productId === productId),
    [productId]
  );

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1600px] mx-auto">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Good morning, Elias.</h1>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">
              Etac is actively tracking <span className="text-foreground font-semibold">{filteredLeads.length} lead conversations</span> for you.
              <span className="text-primary font-medium"> Meridian Design Studio</span> showroom call is booked for 10:30 AM today.
            </p>
          </div>
          <ProductSelector selectedId={productId} onSelect={setProductId} />
        </header>

        <MetricsRow productId={productId} />

        <ConversationAttentionPanel items={attentionItems} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <PipelineBoard leads={filteredLeads} />
          <CalendarPanel />
        </div>
      </div>
    </AppShell>
  );
}
