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
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-8 pt-2 sm:gap-7 sm:px-6 sm:pb-10 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">Good morning, Elias.</h1>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">
              Etac is actively tracking <span className="text-foreground font-semibold">{filteredLeads.length} lead conversations</span> for you.
              <span className="text-primary font-medium"> Meridian Design Studio</span> showroom call is booked for 10:30 AM today.
            </p>
          </div>
          <div className="w-full sm:w-auto sm:shrink-0 sm:self-end">
            <ProductSelector selectedId={productId} onSelect={setProductId} />
          </div>
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
