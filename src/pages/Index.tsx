import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Auth } from '@/components/Auth';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Users, TrendingUp, Shield } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Auth onSuccess={() => navigate('/dashboard')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Skill Exchange</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Exchange Skills,
            <br />
            Build Together
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with others to trade skills peer-to-peer. Learn what you need, teach what you know.
            Powered by AI matching and blockchain reputation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setShowAuth(true)} className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowAuth(true)} className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Matching</h3>
            <p className="text-muted-foreground">
              Advanced AI suggests the perfect skill exchange partners based on semantic similarity
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/20 mb-4">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Peer-to-Peer</h3>
            <p className="text-muted-foreground">
              Direct skill exchanges between members. No middlemen, just authentic connections
            </p>
          </div>

          <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Reputation System</h3>
            <p className="text-muted-foreground">
              Build trust through completed exchanges. Earn points and unlock new opportunities
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Create Your Profile</h3>
              <p className="text-muted-foreground">
                List the skills you can offer and the skills you want to learn. Connect your wallet for blockchain reputation.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              2
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Find Perfect Matches</h3>
              <p className="text-muted-foreground">
                Our AI analyzes skill descriptions and suggests the best exchange partners for you.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              3
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Exchange & Earn</h3>
              <p className="text-muted-foreground">
                Complete skill exchanges, build your reputation, and grow your network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border/50">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Exchanging Skills?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join our community and discover the power of collaborative learning
          </p>
          <Button size="lg" onClick={() => setShowAuth(true)} className="text-lg px-8">
            Join Now
          </Button>
        </div>
      </section>
    </div>
  );
}
