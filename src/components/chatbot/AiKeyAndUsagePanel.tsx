import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Check, Trash2, Infinity as InfinityIcon } from 'lucide-react';

interface Props {
  workspaceId: string;
}

const PLAN_QUOTAS: Record<string, number> = {
  free: 100,
  professional: 3000,
  pro: 3000,
  enterprise: 20000,
};

export const AiKeyAndUsagePanel: React.FC<Props> = ({ workspaceId }) => {
  const { toast } = useToast();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [newKey, setNewKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [usage, setUsage] = useState<number>(0);
  const [tier, setTier] = useState<string>('free');

  const refresh = async () => {
    // Presence of BYO key
    const { data: hasKeyData } = await supabase.rpc('workspace_has_ai_key', {
      _workspace_id: workspaceId,
    });
    setHasKey(!!hasKeyData);

    // Current month usage
    const now = new Date();
    const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const { data: usageRow } = await supabase
      .from('ai_usage')
      .select('message_count')
      .eq('workspace_id', workspaceId)
      .eq('period_month', period)
      .maybeSingle();
    setUsage(usageRow?.message_count ?? 0);

    // Subscription tier
    try {
      const { data: sub } = await supabase.functions.invoke('check-subscription');
      if (sub?.tier) setTier(sub.tier);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (workspaceId) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const saveKey = async () => {
    if (!newKey.startsWith('sk-')) {
      toast({
        title: 'Invalid key',
        description: 'OpenAI keys start with "sk-".',
        variant: 'destructive',
      });
      return;
    }
    setSavingKey(true);
    const { error } = await supabase
      .from('workspace_ai_keys')
      .upsert({ workspace_id: workspaceId, openai_key: newKey }, { onConflict: 'workspace_id' });
    setSavingKey(false);
    if (error) {
      toast({ title: 'Failed to save key', description: error.message, variant: 'destructive' });
      return;
    }
    setNewKey('');
    toast({ title: 'OpenAI key saved', description: 'This workspace now uses your own key with no monthly limit.' });
    refresh();
  };

  const removeKey = async () => {
    const { error } = await supabase
      .from('workspace_ai_keys')
      .delete()
      .eq('workspace_id', workspaceId);
    if (error) {
      toast({ title: 'Failed to remove key', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Key removed', description: 'Usage will now count against your plan quota.' });
    refresh();
  };

  const quota = PLAN_QUOTAS[tier] ?? PLAN_QUOTAS.free;
  const pct = Math.min((usage / quota) * 100, 100);

  return (
    <div className="space-y-4 pt-4 border-t">
      <div>
        <Label className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Bring your own OpenAI key (optional)
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Without a key, AI messages count against your plan's monthly limit. Add a key to skip
          the limit and pay OpenAI directly. Your key is stored securely and is never returned to
          the browser after saving.
        </p>

        {hasKey ? (
          <div className="mt-3 flex items-center justify-between rounded-md border p-3 bg-muted/40">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span>Custom OpenAI key active</span>
              <Badge variant="secondary" className="ml-2">
                <InfinityIcon className="h-3 w-3 mr-1" /> unlimited
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={removeKey}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <Input
              type="password"
              placeholder="sk-..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              autoComplete="off"
            />
            <Button onClick={saveKey} disabled={savingKey || !newKey}>
              {savingKey ? 'Saving...' : 'Save key'}
            </Button>
          </div>
        )}
      </div>

      {!hasKey && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">This month's AI usage</span>
            <span className="text-sm text-muted-foreground">
              {usage.toLocaleString()} / {quota.toLocaleString()} messages
            </span>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            Plan: {tier}. Resets on the 1st of each month.
          </p>
        </div>
      )}
    </div>
  );
};

export default AiKeyAndUsagePanel;
