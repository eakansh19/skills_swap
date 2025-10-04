import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Users, Zap } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    reputation: 0,
    completedExchanges: 0,
    activeAgreements: 0,
    skillsOffered: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [repData, agreementsData, skillsData] = await Promise.all([
        supabase.from('reputation').select('*').eq('user_id', user.id).single(),
        supabase.from('agreements').select('*').or(`provider_id.eq.${user.id},seeker_id.eq.${user.id}`).eq('status', 'active'),
        supabase.from('skills').select('*').eq('user_id', user.id).eq('skill_type', 'offered'),
      ]);

      setStats({
        reputation: repData.data?.total_points || 0,
        completedExchanges: repData.data?.completed_exchanges || 0,
        activeAgreements: agreementsData.data?.length || 0,
        skillsOffered: skillsData.data?.length || 0,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Reputation Points', value: stats.reputation, icon: Sparkles, color: 'text-primary' },
    { title: 'Completed Exchanges', value: stats.completedExchanges, icon: TrendingUp, color: 'text-accent' },
    { title: 'Active Agreements', value: stats.activeAgreements, icon: Users, color: 'text-primary' },
    { title: 'Skills Offered', value: stats.skillsOffered, icon: Zap, color: 'text-accent' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to your skill exchange hub</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with skill bartering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate('/browse')} className="w-full justify-start">
                <Sparkles className="mr-2 h-4 w-4" />
                Find Skill Matches
              </Button>
              <Button onClick={() => navigate('/profile')} variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Update Your Skills
              </Button>
              <Button onClick={() => navigate('/agreements')} variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Agreements
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Simple steps to start exchanging skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">1</div>
                <div>
                  <h4 className="font-medium">Add Your Skills</h4>
                  <p className="text-sm text-muted-foreground">List what you can offer and what you need</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">2</div>
                <div>
                  <h4 className="font-medium">Find Matches</h4>
                  <p className="text-sm text-muted-foreground">AI suggests perfect skill exchange partners</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">3</div>
                <div>
                  <h4 className="font-medium">Complete Exchange</h4>
                  <p className="text-sm text-muted-foreground">Earn reputation points for every successful barter</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
