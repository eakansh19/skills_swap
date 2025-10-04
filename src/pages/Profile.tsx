import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface Skill {
  id?: string;
  skill_name: string;
  skill_type: 'offered' | 'needed';
  proficiency_level?: string;
  description?: string;
}

export default function Profile() {
  const { account, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState<Skill>({
    skill_name: '',
    skill_type: 'offered',
    proficiency_level: 'intermediate',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileData, skillsData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('skills').select('*').eq('user_id', user.id),
    ]);

    if (profileData.data) {
      setBio(profileData.data.bio || '');
    }
    if (skillsData.data) {
      setSkills(skillsData.data as Skill[]);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ bio, wallet_address: account })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
    }
    setLoading(false);
  };

  const handleAddSkill = async () => {
    if (!newSkill.skill_name.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('skills').insert({
      ...newSkill,
      user_id: user.id,
    });

    if (error) {
      toast.error('Failed to add skill');
    } else {
      toast.success('Skill added successfully!');
      setNewSkill({
        skill_name: '',
        skill_type: 'offered',
        proficiency_level: 'intermediate',
        description: '',
      });
      fetchProfile();
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    const { error } = await supabase.from('skills').delete().eq('id', skillId);

    if (error) {
      toast.error('Failed to delete skill');
    } else {
      toast.success('Skill deleted successfully!');
      fetchProfile();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Your Profile</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your bio and wallet connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell others about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Wallet Connection (Optional)</Label>
                {account ? (
                  <div className="flex items-center gap-2">
                    <Input value={account} disabled className="font-mono text-sm" />
                    <Button variant="outline" size="sm" onClick={disconnectWallet}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button onClick={connectWallet} disabled={isConnecting} className="w-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                )}
              </div>

              <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Add New Skill</CardTitle>
              <CardDescription>Add skills you offer or need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skill_name">Skill Name</Label>
                <Input
                  id="skill_name"
                  placeholder="e.g., UI/UX Design"
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill_type">Type</Label>
                <Select
                  value={newSkill.skill_type}
                  onValueChange={(value: 'offered' | 'needed') =>
                    setNewSkill({ ...newSkill, skill_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offered">I Offer This</SelectItem>
                    <SelectItem value="needed">I Need This</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proficiency">Proficiency Level</Label>
                <Select
                  value={newSkill.proficiency_level}
                  onValueChange={(value) =>
                    setNewSkill({ ...newSkill, proficiency_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your skill..."
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={handleAddSkill} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Skill
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Your Skills</CardTitle>
            <CardDescription>Manage your skill listings</CardDescription>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No skills added yet. Add your first skill above!
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {skills.map((skill) => (
                  <Card key={skill.id} className="border-border/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{skill.skill_name}</CardTitle>
                          <CardDescription className="capitalize">
                            {skill.skill_type} • {skill.proficiency_level}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => skill.id && handleDeleteSkill(skill.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    {skill.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
