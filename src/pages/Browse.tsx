import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, User } from 'lucide-react';

interface UserWithSkills {
  user_id: string;
  bio: string;
  reputation: number;
  skills_offered: Array<{ skill_name: string; proficiency_level: string; description: string }>;
  skills_needed: Array<{ skill_name: string; description: string }>;
  match_score?: number;
}

export default function Browse() {
  const [users, setUsers] = useState<UserWithSkills[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      fetchUsers(user.id);
    }
  };

  const fetchUsers = async (userId: string) => {
    setLoading(true);
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, bio')
      .neq('id', userId);

    if (!profilesData) {
      setLoading(false);
      return;
    }

    const usersWithSkills = await Promise.all(
      profilesData.map(async (profile) => {
        const [skillsData, repData] = await Promise.all([
          supabase.from('skills').select('*').eq('user_id', profile.id),
          supabase.from('reputation').select('total_points').eq('user_id', profile.id).single(),
        ]);

        return {
          user_id: profile.id,
          bio: profile.bio || '',
          reputation: repData.data?.total_points || 0,
          skills_offered: skillsData.data?.filter((s) => s.skill_type === 'offered') || [],
          skills_needed: skillsData.data?.filter((s) => s.skill_type === 'needed') || [],
        };
      })
    );

    setUsers(usersWithSkills.filter((u) => u.skills_offered.length > 0));
    setLoading(false);
  };

  const handleFindMatches = async () => {
    setLoading(true);
    
    const { data: mySkills } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', currentUserId);

    if (!mySkills || mySkills.length === 0) {
      toast.error('Please add your skills in your profile first');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('match-skills', {
        body: { userId: currentUserId },
      });

      if (error) throw error;

      if (data.matches && data.matches.length > 0) {
        const matchedUsers = users.map((user) => {
          const match = data.matches.find((m: any) => m.user_id === user.user_id);
          return match ? { ...user, match_score: match.score } : user;
        });

        matchedUsers.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        setUsers(matchedUsers);
        toast.success(`Found ${data.matches.length} potential matches!`);
      } else {
        toast.info('No matches found. Try adding more skills!');
      }
    } catch (error: any) {
      console.error('Error finding matches:', error);
      toast.error('Failed to find matches');
    }
    
    setLoading(false);
  };

  const handleCreateAgreement = async (providerId: string, skillOffered: string) => {
    const { data: myNeededSkills } = await supabase
      .from('skills')
      .select('skill_name')
      .eq('user_id', currentUserId)
      .eq('skill_type', 'needed')
      .limit(1)
      .single();

    if (!myNeededSkills) {
      toast.error('Please add skills you need in your profile first');
      return;
    }

    const { error } = await supabase.from('agreements').insert({
      provider_id: providerId,
      seeker_id: currentUserId,
      skill_offered: skillOffered,
      skill_needed: myNeededSkills.skill_name,
      status: 'pending',
    });

    if (error) {
      toast.error('Failed to create agreement');
    } else {
      toast.success('Agreement request sent!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Browse Skills</h1>
            <p className="text-muted-foreground">Discover potential skill exchange partners</p>
          </div>
          <Button onClick={handleFindMatches} disabled={loading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? 'Finding...' : 'Find AI Matches'}
          </Button>
        </div>

        {users.length === 0 && !loading ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                Be one of the first to add your skills and start connecting!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {users.map((user) => (
              <Card key={user.user_id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Skill Provider
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {user.bio || 'No bio provided'}
                      </CardDescription>
                    </div>
                    {user.match_score !== undefined && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        {Math.round(user.match_score * 100)}% Match
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{user.reputation} Reputation</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Skills Offered:</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.skills_offered.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">
                          {skill.skill_name} ({skill.proficiency_level})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {user.skills_needed.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Looking For:</h4>
                      <div className="flex flex-wrap gap-2">
                        {user.skills_needed.map((skill, idx) => (
                          <Badge key={idx} variant="outline">
                            {skill.skill_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() =>
                      handleCreateAgreement(user.user_id, user.skills_offered[0].skill_name)
                    }
                    className="w-full"
                    size="sm"
                  >
                    Propose Exchange
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
