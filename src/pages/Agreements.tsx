import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Agreement {
  id: string;
  provider_id: string;
  seeker_id: string;
  skill_offered: string;
  skill_needed: string;
  status: string;
  created_at: string;
}

export default function Agreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const { data } = await supabase
      .from('agreements')
      .select('*')
      .or(`provider_id.eq.${user.id},seeker_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      setAgreements(data);
    }
  };

  const handleUpdateStatus = async (agreementId: string, newStatus: string) => {
    const { error } = await supabase
      .from('agreements')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', agreementId);

    if (error) {
      toast.error('Failed to update agreement');
    } else {
      toast.success(`Agreement ${newStatus}!`);
      fetchAgreements();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400', icon: Clock },
      active: { color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400', icon: Clock },
      completed: { color: 'bg-green-500/20 text-green-700 dark:text-green-400', icon: CheckCircle2 },
      cancelled: { color: 'bg-red-500/20 text-red-700 dark:text-red-400', icon: XCircle },
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Your Agreements</h1>

        {agreements.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No agreements yet</h3>
              <p className="text-muted-foreground">
                Start browsing skills to create your first exchange agreement!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {agreements.map((agreement) => {
              const isProvider = agreement.provider_id === currentUserId;
              return (
                <Card key={agreement.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {isProvider ? 'You provide' : 'You receive'}: {agreement.skill_offered}
                        </CardTitle>
                        <CardDescription>
                          {isProvider ? 'They need' : 'You need'}: {agreement.skill_needed}
                        </CardDescription>
                      </div>
                      {getStatusBadge(agreement.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {agreement.status === 'pending' && isProvider && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(agreement.id, 'active')}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(agreement.id, 'cancelled')}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {agreement.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(agreement.id, 'completed')}
                          >
                            Mark as Completed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(agreement.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
